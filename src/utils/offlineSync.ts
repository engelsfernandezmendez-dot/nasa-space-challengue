import type { BiomedicalMeasurement, MentalAssessment, MissionTask } from '../types/kawsay';
import { apiFetch } from './authToken';

export interface OfflineMutationItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  createdAt: string;
  description: string;
  localSnapshotUpdatedAt?: string;
}

export interface SyncConflictItem {
  mutationId: string;
  description: string;
  reason: string;
}

export interface OfflineCacheData {
  measurements: BiomedicalMeasurement[];
  tasks: MissionTask[];
  assessments?: MentalAssessment[];
  savedAt: string;
}

const CACHE_KEY = 'kawsay_nova_offline_cache_v1';
const QUEUE_KEY = 'kawsay_nova_offline_queue_v1';
const LAST_SYNC_KEY = 'kawsay_nova_last_sync_v1';

const IDB_NAME = 'kawsay_nova_idb_v1';
const IDB_VERSION = 1;
const STORE_CACHE = 'cache';
const STORE_QUEUE = 'queue';

export const STORAGE_ARCHITECTURE_NOTE =
  'Primary storage uses the server SQLite database (data/kawsay_nova.db) across sessions. Client IndexedDB (with localStorage fallback) provides browser-local offline caching and queued mutations; local browser storage is confined to this browser profile and clears if site data is wiped.';

function hasIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openKawsayIdb(): Promise<IDBDatabase | null> {
  if (!hasIndexedDb()) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains(STORE_CACHE)) {
          idb.createObjectStore(STORE_CACHE);
        }
        if (!idb.objectStoreNames.contains(STORE_QUEUE)) {
          idb.createObjectStore(STORE_QUEUE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(storeName: string, key: string, value: unknown): Promise<void> {
  const idb = await openKawsayIdb();
  if (!idb) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = idb.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => {
        idb.close();
        resolve();
      };
      tx.onerror = () => {
        idb.close();
        resolve();
      };
    } catch {
      resolve();
    }
  });
}

async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  const idb = await openKawsayIdb();
  if (!idb) return null;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => {
        idb.close();
        resolve((req.result as T) ?? null);
      };
      req.onerror = () => {
        idb.close();
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export function saveOfflineCache(
  measurements: BiomedicalMeasurement[],
  tasks: MissionTask[],
  assessments?: MentalAssessment[]
) {
  const payload: OfflineCacheData = {
    measurements,
    tasks,
    assessments,
    savedAt: new Date().toISOString(),
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      localStorage.setItem(LAST_SYNC_KEY, payload.savedAt);
    }
  } catch {
    // ignore quota limits
  }
  void idbPut(STORE_CACHE, 'latest', payload);
}

export function loadOfflineCache(): OfflineCacheData | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineCacheData;
  } catch {
    return null;
  }
}

export async function loadOfflineCacheAsync(): Promise<OfflineCacheData | null> {
  const idbData = await idbGet<OfflineCacheData>(STORE_CACHE, 'latest');
  if (idbData) return idbData;
  return loadOfflineCache();
}

export function getLastSyncTimestamp(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export function getOfflineQueue(): OfflineMutationItem[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineMutationItem[];
  } catch {
    return [];
  }
}

export function enqueueOfflineMutation(
  item: Omit<OfflineMutationItem, 'id' | 'createdAt'>
): OfflineMutationItem[] {
  const queue = getOfflineQueue();
  const next: OfflineMutationItem[] = [
    ...queue,
    {
      ...item,
      id: `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    },
  ];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
  void idbPut(STORE_QUEUE, 'pending', next);
  return next;
}

export function clearOfflineQueue() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(QUEUE_KEY);
    }
  } catch {
    // ignore
  }
  void idbPut(STORE_QUEUE, 'pending', []);
}

export async function getOfflineStorageStats(): Promise<{
  indexedDbAvailable: boolean;
  lastSavedAt: string | null;
  pendingMutations: number;
}> {
  const idbData = await idbGet<OfflineCacheData>(STORE_CACHE, 'latest');
  const queue = getOfflineQueue();
  return {
    indexedDbAvailable: hasIndexedDb(),
    lastSavedAt: idbData?.savedAt ?? getLastSyncTimestamp(),
    pendingMutations: queue.length,
  };
}

export async function flushOfflineQueue(): Promise<{
  syncedCount: number;
  conflicts: SyncConflictItem[];
}> {
  const idbQueue = await idbGet<OfflineMutationItem[]>(STORE_QUEUE, 'pending');
  const queue = idbQueue && idbQueue.length > 0 ? idbQueue : getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, conflicts: [] };
  }

  const remaining: OfflineMutationItem[] = [];
  const conflicts: SyncConflictItem[] = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      const res = await apiFetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: item.method === 'DELETE' ? undefined : JSON.stringify(item.payload),
      });
      if (res.ok) {
        syncedCount += 1;
      } else if (res.status === 409 || res.status === 404 || res.status === 403 || res.status === 400) {
        const data = await res.json().catch(() => ({}));
        conflicts.push({
          mutationId: item.id,
          description: item.description,
          reason: data.error || `Server responded with status ${res.status}`,
        });
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      if (syncedCount > 0) {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      }
    }
  } catch {
    // ignore
  }
  await idbPut(STORE_QUEUE, 'pending', remaining);

  return { syncedCount, conflicts };
}
