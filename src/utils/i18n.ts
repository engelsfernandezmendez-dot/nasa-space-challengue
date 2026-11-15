import type { LanguageCode } from '../types/kawsay';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'es', label: 'Spanish', nativeName: 'Español' },
  { code: 'qu', label: 'Ayacucho Quechua', nativeName: 'Runasimi (Ayakuchu)' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'de', label: 'German', nativeName: 'Deutsch' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語' },
  { code: 'zh', label: 'Chinese', nativeName: '中文' },
];

export interface TranslationBundle {
  // Brand & Landing
  appSubtitle: string;
  slogan: string;
  vision: string;
  landingSummary: string;
  landingOrigin: string;
  landingDisclaimer: string;
  enterSystem: string;
  backToLanding: string;

  // All 19 Master Modules + Profile/Governance/About
  navDashboard: string;
  navAstronautProfile: string;
  navBiomedical: string;
  navPrecisionCore: string;
  navAccuracyControl: string;
  navDigitalTwin: string;
  navResilienceEngine: string;
  navMissionSimulator: string;
  navSpaceRisks: string;
  navMentalWellbeing: string;
  navSleepActivity: string;
  navKnowledgeCenter: string;
  navMissionCalendar: string;
  navHealthAnalytics: string;
  navReports: string;
  navAiAssistant: string;
  navUniversalTranslator: string;
  navGlobalAdaptation: string;
  navSettings: string;
  navProfile: string;
  navGovernance: string;
  navAbout: string;

  // Profile Menu & Actions
  menuMyProfile: string;
  menuAccountSettings: string;
  menuLanguagePreferences: string;
  menuNotifications: string;
  menuSecurity: string;
  menuLogOut: string;
  editProfile: string;
  saveChanges: string;
  cancel: string;
  changeApplicationLogo: string;
  restoreOriginalLogo: string;

  // Settings Sections
  settingsPersonal: string;
  settingsSecurity: string;
  settingsLanguage: string;
  settingsNotifications: string;
  settingsBranding: string;
  settingsData: string;
  settingsPrivacy: string;

  // Common Labels & Scientific Integrity
  demoDataBanner: string;
  simulationBanner: string;
  offlineStatusOnline: string;
  offlineStatusOffline: string;
  translatorTitle: string;
  translatorPlaceholder: string;
  translateBtn: string;
  copyBtn: string;
  saveTermBtn: string;
  pronounceBtn: string;
  quechuaVerificationNote: string;
}

const EN: TranslationBundle = {
  appSubtitle: 'ADVANCED ASTRONAUT HEALTH MONITORING SYSTEM',
  slogan: 'EXPLORE. MONITOR. PROTECT.',
  vision: 'FROM SPACE TO THE WORLD.',
  landingSummary:
    'Protecting human health beyond Earth, advancing scientific knowledge, and exploring possibilities for a healthier world.',
  landingOrigin:
    'Originating in Ayacucho, Peru, KAWSAY NOVA monitors physical and psychological astronaut well-being across Moon, Mars, and orbital missions.',
  landingDisclaimer:
    'Independent technological project proposal. Not an officially NASA-approved, funded, or deployed system.',
  enterSystem: 'ENTER SYSTEM',
  backToLanding: 'Landing Overview',

  navDashboard: 'Mission Control Dashboard',
  navAstronautProfile: 'Astronaut Profile',
  navBiomedical: 'Biomedical Monitoring',
  navPrecisionCore: 'NOVA PRECISION CORE',
  navAccuracyControl: 'NOVA ACCURACY CONTROL',
  navDigitalTwin: 'NOVA DIGITAL TWIN',
  navResilienceEngine: 'NOVA RESILIENCE ENGINE',
  navMissionSimulator: 'NOVA MISSION SIMULATOR',
  navSpaceRisks: 'Space Health Risks',
  navMentalWellbeing: 'Mental Well-being',
  navSleepActivity: 'Sleep & Physical Activity',
  navKnowledgeCenter: 'Medical Knowledge Center',
  navMissionCalendar: 'Mission Calendar',
  navHealthAnalytics: 'Health Analytics',
  navReports: 'Medical Reports',
  navAiAssistant: 'NOVA AI Assistant',
  navUniversalTranslator: 'NOVA UNIVERSAL TRANSLATOR',
  navGlobalAdaptation: 'Global Adaptation',
  navSettings: 'Settings & Security',
  navProfile: 'My Profile',
  navGovernance: 'Role Governance',
  navAbout: 'About KAWSAY NOVA',

  menuMyProfile: 'My Profile',
  menuAccountSettings: 'Account Settings',
  menuLanguagePreferences: 'Language Preferences',
  menuNotifications: 'Notifications',
  menuSecurity: 'Security',
  menuLogOut: 'Log Out',
  editProfile: 'Edit Profile',
  saveChanges: 'Save Changes',
  cancel: 'Cancel',
  changeApplicationLogo: 'CHANGE APPLICATION LOGO',
  restoreOriginalLogo: 'Restore Original Logo',

  settingsPersonal: 'Personal Information',
  settingsSecurity: 'Account Security',
  settingsLanguage: 'Language and Translation',
  settingsNotifications: 'Notifications',
  settingsBranding: 'Branding and Identity',
  settingsData: 'Data Management',
  settingsPrivacy: 'Privacy and Permissions',

  demoDataBanner: 'DEMO / SIMULATED DATA — Fictional astronaut baseline for scientific demonstration.',
  simulationBanner: 'SIMULATION — NOT AN ACTUAL MEDICAL MEASUREMENT OR VALIDATED INDIVIDUAL PREDICTION.',
  offlineStatusOnline: 'Synchronized · Online',
  offlineStatusOffline: 'Offline Cache Active',
  translatorTitle: 'NOVA UNIVERSAL TRANSLATOR',
  translatorPlaceholder: 'Enter or select visible text, medical terms, or scientific explanations...',
  translateBtn: 'Translate',
  copyBtn: 'Copy',
  saveTermBtn: 'Save',
  pronounceBtn: 'Pronounce',
  quechuaVerificationNote: 'Ayacucho Quechua technical glossary uses reviewed terms; specialized clinical terms marked [Verify] require linguistic verification.',
};

const ES: TranslationBundle = {
  appSubtitle: 'SISTEMA AVANZADO DE MONITOREO DE SALUD ASTRONÁUTICA',
  slogan: 'EXPLORAR. MONITOREAR. PROTEGER.',
  vision: 'DEL ESPACIO AL MUNDO.',
  landingSummary:
    'Protegiendo la salud humana más allá de la Tierra, impulsando el conocimiento científico y explorando posibilidades para un mundo más saludable.',
  landingOrigin:
    'Originado en Ayacucho, Perú, KAWSAY NOVA monitorea el bienestar físico y psicológico de los astronautas en misiones lunares, marcianas y orbitales.',
  landingDisclaimer:
    'Propuesta tecnológica independiente. No es un sistema aprobado, financiado ni desplegado oficialmente por la NASA.',
  enterSystem: 'INGRESAR AL SISTEMA',
  backToLanding: 'Portada Principal',

  navDashboard: 'Panel de Control de Misión',
  navAstronautProfile: 'Perfil del Astronauta',
  navBiomedical: 'Monitoreo Biomédico',
  navPrecisionCore: 'NOVA PRECISION CORE',
  navAccuracyControl: 'NOVA ACCURACY CONTROL',
  navDigitalTwin: 'GEMELO DIGITAL NOVA',
  navResilienceEngine: 'MOTOR DE RESILIENCIA NOVA',
  navMissionSimulator: 'SIMULADOR DE MISIÓN NOVA',
  navSpaceRisks: 'Riesgos de Salud Espacial',
  navMentalWellbeing: 'Bienestar Mental',
  navSleepActivity: 'Sueño y Actividad Física',
  navKnowledgeCenter: 'Centro de Conocimiento Médico',
  navMissionCalendar: 'Calendario de Misión',
  navHealthAnalytics: 'Analítica de Salud',
  navReports: 'Informes Médicos',
  navAiAssistant: 'Asistente NOVA AI',
  navUniversalTranslator: 'TRADUCTOR UNIVERSAL NOVA',
  navGlobalAdaptation: 'Adaptación Global',
  navSettings: 'Configuración y Seguridad',
  navProfile: 'Mi Perfil',
  navGovernance: 'Gobernanza de Roles',
  navAbout: 'Acerca de KAWSAY NOVA',

  menuMyProfile: 'Mi Perfil',
  menuAccountSettings: 'Configuración de Cuenta',
  menuLanguagePreferences: 'Preferencias de Idioma',
  menuNotifications: 'Notificaciones',
  menuSecurity: 'Seguridad',
  menuLogOut: 'Cerrar Sesión',
  editProfile: 'Editar Perfil',
  saveChanges: 'Guardar Cambios',
  cancel: 'Cancelar',
  changeApplicationLogo: 'CHANGE APPLICATION LOGO',
  restoreOriginalLogo: 'Restaurar Logo Original',

  settingsPersonal: 'Información Personal',
  settingsSecurity: 'Seguridad de la Cuenta',
  settingsLanguage: 'Idioma y Traducción',
  settingsNotifications: 'Notificaciones',
  settingsBranding: 'Marca e Identidad',
  settingsData: 'Gestión de Datos',
  settingsPrivacy: 'Privacidad y Permisos',

  demoDataBanner: 'DATOS DE DEMOSTRACIÓN / SIMULADOS — Perfil ficticio con fines científicos.',
  simulationBanner: 'SIMULACIÓN — NO ES UNA MEDICIÓN MÉDICA REAL NI UNA PREDICCIÓN INDIVIDUAL VALIDADA.',
  offlineStatusOnline: 'Sincronizado · En línea',
  offlineStatusOffline: 'Caché Sin Conexión Activa',
  translatorTitle: 'TRADUCTOR UNIVERSAL NOVA',
  translatorPlaceholder: 'Ingrese o seleccione texto visible, términos médicos o explicaciones científicas...',
  translateBtn: 'Traducir',
  copyBtn: 'Copiar',
  saveTermBtn: 'Guardar',
  pronounceBtn: 'Pronunciar',
  quechuaVerificationNote: 'El glosario en quechua ayacuchano usa términos revisados; los términos especializados con [Verificar] requieren validación lingüística.',
};

const QU: TranslationBundle = {
  appSubtitle: 'HANAQ PACHAPI RUNAP ALLIN KAYNIN QAWAY SISTEMA',
  slogan: 'MASKAY. QAWAY. WAQAYCHAY.',
  vision: 'HANAQ PACHAMANTA LLAQTANCHIKKUNAMAN.',
  landingSummary:
    'Allpa pachap hawanpi runap allin kayninta waqaychay, yachaykunata ñawpaqman pusay, hinaspa pachanchikpa allin kayninpaq yanapakuy.',
  landingOrigin:
    'Ayakuchu, Perumanta paqarimusqa, KAWSAY NOVAqa Killa, Marte, hinaspa hanaq pacha puriykunapi astronautakunap cuerponkuta sunqunkutapas qawan [Verify: astronautakuna].',
  landingDisclaimer:
    'Sapaq yachay tecnologico proyectom. Manam NASApa oficial aprobacionninwanchu.',
  enterSystem: 'SISTEMAMAN YAYKUY',
  backToLanding: 'Qallariy Qhawana',

  navDashboard: 'Misión Kamachiy Qhawana',
  navAstronautProfile: 'Astronautap Perfilnin [Verify]',
  navBiomedical: 'Biomédico Qaway [Verify]',
  navPrecisionCore: 'NOVA PRECISION CORE',
  navAccuracyControl: 'NOVA ACCURACY CONTROL',
  navDigitalTwin: 'NOVA DIGITAL TWIN',
  navResilienceEngine: 'NOVA RESILIENCE ENGINE',
  navMissionSimulator: 'NOVA MISSION SIMULATOR',
  navSpaceRisks: 'Hanaq Pacha Unquy Sasachakuykuna',
  navMentalWellbeing: 'Sunqu Allin Kay',
  navSleepActivity: 'Puñuy hinaspa Kuyuy',
  navKnowledgeCenter: 'Hampiy Yachay Wasi',
  navMissionCalendar: 'Misión Punchawkuna',
  navHealthAnalytics: 'Allin Kay Tupuykuna',
  navReports: 'Hampiy Willakuykuna',
  navAiAssistant: 'NOVA AI Yanapaq',
  navUniversalTranslator: 'NOVA TIJRAQ',
  navGlobalAdaptation: 'Pachantinman Chayachiy',
  navSettings: 'Allichay hinaspa Waqaychay',
  navProfile: 'Ñuqap Perfilniy',
  navGovernance: 'Ruraqkuna Kamachiy',
  navAbout: 'KAWSAY NOVA Manta',

  menuMyProfile: 'Ñuqap Perfilniy',
  menuAccountSettings: 'Cuenta Allichay',
  menuLanguagePreferences: 'Simi Akllay',
  menuNotifications: 'Willakuykuna',
  menuSecurity: 'Waqaychay',
  menuLogOut: 'Lluqsiy',
  editProfile: 'Allichay',
  saveChanges: 'Waqaychay',
  cancel: 'Sayachiy',
  changeApplicationLogo: 'CHANGE APPLICATION LOGO',
  restoreOriginalLogo: 'Qallariy Logota Kutichiy',

  settingsPersonal: 'Runap Willakuynin',
  settingsSecurity: 'Cuenta Waqaychay',
  settingsLanguage: 'Simi hinaspa Tijray',
  settingsNotifications: 'Willakuykuna',
  settingsBranding: 'Riqsichiy hinaspa Logo',
  settingsData: 'Datos Kamachiy',
  settingsPrivacy: 'Pakay hinaspa Permisokuna',

  demoDataBanner: 'QAWACHIY DATOS — Yachaypaq rurasqa datosmi.',
  simulationBanner: 'SIMULACIÓN — MANAM CHEQAQ HAMPIY TUPUYCHU.',
  offlineStatusOnline: 'Tinkisqa · Internetniyuq',
  offlineStatusOffline: 'Mana Internetniyuq Waqaychasqa',
  translatorTitle: 'NOVA UNIVERSAL TRANSLATOR',
  translatorPlaceholder: 'Qillqay utaq akllay qawasqayki simikunata...',
  translateBtn: 'Tijray',
  copyBtn: 'Copiay',
  saveTermBtn: 'Waqaychay',
  pronounceBtn: 'Rimarichiy',
  quechuaVerificationNote: 'Ayakuchu Runasimipi [Verify] nisqa simikunaqa yachaqkunap qawananraqmi.',
};

const PT: TranslationBundle = {
  ...EN,
  appSubtitle: 'SISTEMA AVANÇADO DE MONITORAMENTO DE SAÚDE ASTRONÁUTICA',
  slogan: 'EXPLORAR. MONITORAR. PROTEGER.',
  vision: 'DO ESPAÇO PARA O MUNDO.',
  landingSummary:
    'Protegendo a saúde humana além da Terra, avançando o conhecimento científico e explorando possibilidades para um mundo mais saudável.',
  landingOrigin:
    'Originado em Ayacucho, Peru, o KAWSAY NOVA monitora o bem-estar físico e psicológico de astronautas em missões lunares, marcianas e orbitais.',
  landingDisclaimer:
    'Proposta tecnológica independente. Não é um sistema aprovado, financiado ou implantado oficialmente pela NASA.',
  enterSystem: 'ENTRAR NO SISTEMA',
  backToLanding: 'Página Inicial',
  navDashboard: 'Painel de Controle da Missão',
  navAstronautProfile: 'Perfil do Astronauta',
  navBiomedical: 'Monitoramento Biomédico',
  navSpaceRisks: 'Riscos à Saúde Espacial',
  navMentalWellbeing: 'Bem-estar Mental',
  navSleepActivity: 'Sono e Atividade Física',
  navKnowledgeCenter: 'Centro de Conhecimento Médico',
  navMissionCalendar: 'Calendário da Missão',
  navHealthAnalytics: 'Análise de Saúde',
  navReports: 'Relatórios Médicos',
  navGlobalAdaptation: 'Adaptação Global',
  navSettings: 'Configurações e Segurança',
  navProfile: 'Meu Perfil',
  navGovernance: 'Governança de Funções',
  navAbout: 'Sobre o KAWSAY NOVA',
  menuMyProfile: 'Meu Perfil',
  menuAccountSettings: 'Configurações da Conta',
  menuLanguagePreferences: 'Preferências de Idioma',
  menuNotifications: 'Notificações',
  menuSecurity: 'Segurança',
  menuLogOut: 'Sair',
  editProfile: 'Editar Perfil',
  saveChanges: 'Salvar Alterações',
  cancel: 'Cancelar',
  restoreOriginalLogo: 'Restaurar Logotipo Original',
  settingsPersonal: 'Informações Pessoais',
  settingsSecurity: 'Segurança da Conta',
  settingsLanguage: 'Idioma e Tradução',
  settingsNotifications: 'Notificações',
  settingsBranding: 'Marca e Identidade',
  settingsData: 'Gerenciamento de Dados',
  settingsPrivacy: 'Privacidade e Permissões',
  demoDataBanner: 'DADOS DE DEMONSTRAÇÃO / SIMULADOS — Perfil fictício para demonstração científica.',
  simulationBanner: 'SIMULAÇÃO — NÃO É UMA MEDIÇÃO MÉDICA REAL NEM PREVISÃO INDIVIDUAL VALIDADA.',
  translateBtn: 'Traduzir',
  copyBtn: 'Copiar',
  saveTermBtn: 'Salvar',
};

const FR: TranslationBundle = {
  ...EN,
  appSubtitle: 'SYSTÈME AVANCÉ DE SURVEILLANCE MÉDICALE ASTRONAUTIQUE',
  slogan: 'EXPLORER. SURVEILLER. PROTÉGER.',
  vision: 'DE L’ESPACE VERS LE MONDE.',
  landingSummary:
    'Protéger la santé humaine au-delà de la Terre, faire progresser la science et explorer des perspectives pour un monde en meilleure santé.',
  landingOrigin:
    'Originaire d’Ayacucho, au Pérou, KAWSAY NOVA suit le bien-être physique et psychologique des astronautes lors des missions lunaires, martiennes et orbitales.',
  landingDisclaimer:
    'Proposition technologique indépendante. Ce système n’est ni approuvé, ni financé, ni déployé officiellement par la NASA.',
  enterSystem: 'ENTRER DANS LE SYSTÈME',
  backToLanding: 'Accueil',
  navDashboard: 'Tableau de Contrôle de Mission',
  navAstronautProfile: 'Profil Astronaute',
  navBiomedical: 'Suivi Biomédical',
  navSpaceRisks: 'Risques de Santé Spatiale',
  navMentalWellbeing: 'Bien-être Mental',
  navSleepActivity: 'Sommeil et Activité Physique',
  navKnowledgeCenter: 'Centre de Connaissances Médicales',
  navMissionCalendar: 'Calendrier de Mission',
  navHealthAnalytics: 'Analytique de Santé',
  navReports: 'Rapports Médicaux',
  navGlobalAdaptation: 'Adaptation Globale',
  navSettings: 'Paramètres et Sécurité',
  navProfile: 'Mon Profil',
  navGovernance: 'Gouvernance des Rôles',
  navAbout: 'À propos de KAWSAY NOVA',
  menuMyProfile: 'Mon Profil',
  menuAccountSettings: 'Paramètres du Compte',
  menuLanguagePreferences: 'Préférences Linguistiques',
  menuNotifications: 'Notifications',
  menuSecurity: 'Sécurité',
  menuLogOut: 'Déconnexion',
  editProfile: 'Modifier le Profil',
  saveChanges: 'Enregistrer',
  cancel: 'Annuler',
  restoreOriginalLogo: 'Restaurer le Logo d’Origine',
  settingsPersonal: 'Informations Personnelles',
  settingsSecurity: 'Sécurité du Compte',
  settingsLanguage: 'Langue et Traduction',
  settingsNotifications: 'Notifications',
  settingsBranding: 'Image de Marque et Identité',
  settingsData: 'Gestion des Données',
  settingsPrivacy: 'Confidentialité et Autorisations',
  demoDataBanner: 'DONNÉES DE DÉMONSTRATION / SIMULÉES — Profil fictif à des fins scientifiques.',
  simulationBanner: 'SIMULATION — CECI N’EST PAS UNE MESURE MÉDICALE RÉELLE NI UNE PRÉDICTION INDIVIDUELLE VALIDÉE.',
  translateBtn: 'Traduire',
  copyBtn: 'Copier',
  saveTermBtn: 'Enregistrer',
};

const DE: TranslationBundle = {
  ...EN,
  appSubtitle: 'FORTSCHRITTLICHES ASTRONAUTEN-GESUNDHEITSÜBERWACHUNGSSYSTEM',
  slogan: 'ERKUNDEN. ÜBERWACHEN. SCHÜTZEN.',
  vision: 'VOM WELTRAUM IN DIE WELT.',
  landingSummary:
    'Schutz der menschlichen Gesundheit jenseits der Erde, Förderung wissenschaftlicher Erkenntnisse und Erforschung neuer Perspektiven für eine gesündere Welt.',
  landingOrigin:
    'Mit Ursprung in Ayacucho, Peru, überwacht KAWSAY NOVA das physische und psychische Wohlbefinden von Astronauten bei Mond-, Mars- und Orbitalmissionen.',
  landingDisclaimer:
    'Unabhängiger Technologievorschlag. Kein offiziell von der NASA genehmigtes, finanziertes oder eingesetztes System.',
  enterSystem: 'SYSTEM STARTEN',
  backToLanding: 'Startseite',
  navDashboard: 'Missions-Kontrollzentrum',
  navAstronautProfile: 'Astronautenprofil',
  navBiomedical: 'Biomedizinische Überwachung',
  navSpaceRisks: 'Gesundheitsrisiken im All',
  navMentalWellbeing: 'Psychisches Wohlbefinden',
  navSleepActivity: 'Schlaf & Körperliche Aktivität',
  navKnowledgeCenter: 'Medizinisches Wissenszentrum',
  navMissionCalendar: 'Missionskalender',
  navHealthAnalytics: 'Gesundheitsanalytik',
  navReports: 'Medizinische Berichte',
  navGlobalAdaptation: 'Globale Anpassung',
  navSettings: 'Einstellungen & Sicherheit',
  navProfile: 'Mein Profil',
  navGovernance: 'Rollenverwaltung',
  navAbout: 'Über KAWSAY NOVA',
  menuMyProfile: 'Mein Profil',
  menuAccountSettings: 'Kontoeinstellungen',
  menuLanguagePreferences: 'Spracheinstellungen',
  menuNotifications: 'Benachrichtigungen',
  menuSecurity: 'Sicherheit',
  menuLogOut: 'Abmelden',
  editProfile: 'Profil bearbeiten',
  saveChanges: 'Änderungen speichern',
  cancel: 'Abbrechen',
  restoreOriginalLogo: 'Original-Logo wiederherstellen',
  settingsPersonal: 'Persönliche Informationen',
  settingsSecurity: 'Kontosicherheit',
  settingsLanguage: 'Sprache und Übersetzung',
  settingsNotifications: 'Benachrichtigungen',
  settingsBranding: 'Marke und Identität',
  settingsData: 'Datenverwaltung',
  settingsPrivacy: 'Datenschutz und Berechtigungen',
  demoDataBanner: 'DEMO- / SIMULIERTE DATEN — Fiktives Astronautenprofil für wissenschaftliche Demonstrationen.',
  simulationBanner: 'SIMULATION — KEINE TATSÄCHLICHE MEDIZINISCHE MESSUNG ODER VALIDIERTE EINZELPROGNOSE.',
  translateBtn: 'Übersetzen',
  copyBtn: 'Kopieren',
  saveTermBtn: 'Speichern',
};

const JA: TranslationBundle = {
  ...EN,
  appSubtitle: '先進宇宙飛行士健康モニタリングシステム',
  slogan: '探査。監視。保護。',
  vision: '宇宙から世界へ。',
  landingSummary:
    '地球を超えた人類の健康を守り、科学的知見を発展させ、より健康な世界への可能性を探求します。',
  landingOrigin:
    'ペルー・アヤクーチョ発の本プロジェクトは、月・火星・軌道ミッションにおける宇宙飛行士の心身の健康を監視します。',
  landingDisclaimer:
    '独立した技術提案プロジェクトです。NASAによる公式な承認・資金提供・運用システムではありません。',
  enterSystem: 'システムに入る',
  backToLanding: 'ランディングページ',
  navDashboard: 'ミッション管制ダッシュボード',
  navAstronautProfile: '宇宙飛行士プロフィール',
  navBiomedical: '生体医工学モニタリング',
  navSpaceRisks: '宇宙健康リスク',
  navMentalWellbeing: 'メンタルヘルス',
  navSleepActivity: '睡眠・身体活動',
  navKnowledgeCenter: '医学知識センター',
  navMissionCalendar: 'ミッションカレンダー',
  navHealthAnalytics: '健康データ解析',
  navReports: '医療レポート',
  navGlobalAdaptation: '地球規模での応用',
  navSettings: '設定・セキュリティ',
  navProfile: 'マイプロフィール',
  navGovernance: '権限管理',
  navAbout: 'KAWSAY NOVAについて',
  menuMyProfile: 'マイプロフィール',
  menuAccountSettings: 'アカウント設定',
  menuLanguagePreferences: '言語設定',
  menuNotifications: '通知',
  menuSecurity: 'セキュリティ',
  menuLogOut: 'ログアウト',
  editProfile: 'プロフィール編集',
  saveChanges: '変更を保存',
  cancel: 'キャンセル',
  restoreOriginalLogo: '元のロゴを復元',
  settingsPersonal: '個人情報',
  settingsSecurity: 'アカウントセキュリティ',
  settingsLanguage: '言語と翻訳',
  settingsNotifications: '通知',
  settingsBranding: 'ブランディングとID',
  settingsData: 'データ管理',
  settingsPrivacy: 'プライバシーと権限',
  demoDataBanner: 'デモ / シミュレーションデータ — 科学デモンストレーション用の架空データです。',
  simulationBanner: 'シミュレーション — 実際の医療測定値や個人の検証済み予測ではありません。',
  translateBtn: '翻訳する',
  copyBtn: 'コピー',
  saveTermBtn: '保存',
};

const ZH: TranslationBundle = {
  ...EN,
  appSubtitle: '先进航天员健康监测系统',
  slogan: '探索。监测。保护。',
  vision: '从太空走向世界。',
  landingSummary:
    '在地球之外守护人类健康，推进科学认知，并探索造福全球健康的未来可能。',
  landingOrigin:
    '起源于秘鲁阿亚库乔，KAWSAY NOVA 致力于监测月球、火星及轨道任务中航天员的身心健康指标。',
  landingDisclaimer:
    '独立技术研究提案。并非 NASA 官方批准、资助或部署的系统。',
  enterSystem: '进入系统',
  backToLanding: '返回首页',
  navDashboard: '任务控制仪表盘',
  navAstronautProfile: '航天员档案',
  navBiomedical: '生物医学监测',
  navSpaceRisks: '太空健康风险',
  navMentalWellbeing: '心理健康',
  navSleepActivity: '睡眠与体能活动',
  navKnowledgeCenter: '医学知识中心',
  navMissionCalendar: '任务日历',
  navHealthAnalytics: '健康数据分析',
  navReports: '医疗报告',
  navGlobalAdaptation: '全球地面应用',
  navSettings: '设置与安全',
  navProfile: '个人资料',
  navGovernance: '角色权限治理',
  navAbout: '关于 KAWSAY NOVA',
  menuMyProfile: '个人资料',
  menuAccountSettings: '账户设置',
  menuLanguagePreferences: '语言偏好',
  menuNotifications: '通知设置',
  menuSecurity: '账户安全',
  menuLogOut: '退出登录',
  editProfile: '编辑资料',
  saveChanges: '保存更改',
  cancel: '取消',
  restoreOriginalLogo: '恢复原始标志',
  settingsPersonal: '个人信息',
  settingsSecurity: '账户安全',
  settingsLanguage: '语言与翻译',
  settingsNotifications: '通知偏好',
  settingsBranding: '品牌与标识管理',
  settingsData: '数据管理',
  settingsPrivacy: '隐私与权限',
  demoDataBanner: '演示 / 模拟数据 — 仅供科学演示使用的虚构航天员基线。',
  simulationBanner: '模拟推演 — 非真实医学测量值，亦不构成个体临床预测。',
  translateBtn: '翻译',
  copyBtn: '复制',
  saveTermBtn: '保存',
};

const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: EN,
  es: ES,
  qu: QU,
  pt: PT,
  fr: FR,
  de: DE,
  ja: JA,
  zh: ZH,
};

export function getTranslations(lang: LanguageCode | string | undefined): TranslationBundle {
  if (lang && lang in TRANSLATIONS) {
    return TRANSLATIONS[lang as LanguageCode];
  }
  return TRANSLATIONS.en;
}

// Offline aerospace & medical glossary preserving formulas, units, and reviewed Ayacucho Quechua terms
export const OFFLINE_MEDICAL_GLOSSARY: Array<{
  term: string;
  explanation: string;
  translations: Record<LanguageCode, string>;
}> = [
  {
    term: 'Heart Rate (BPM)',
    explanation: 'Number of ventricular contractions per minute. Formula: HR = 60 / mean(RR_seconds).',
    translations: {
      en: 'Heart Rate (BPM)',
      es: 'Frecuencia Cardíaca (BPM)',
      qu: 'Sunqup Tiktiknin (BPM) [Verify: BPM]',
      pt: 'Frequência Cardíaca (BPM)',
      fr: 'Fréquence Cardiaque (BPM)',
      de: 'Herzfrequenz (BPM)',
      ja: '心拍数 (BPM)',
      zh: '心率 (BPM)',
    },
  },
  {
    term: 'Oxygen Saturation (SpO2)',
    explanation: 'Percentage of hemoglobin binding sites occupied by oxygen, measured by pulse oximetry (%).',
    translations: {
      en: 'Oxygen Saturation (SpO2)',
      es: 'Saturación de Oxígeno (SpO2)',
      qu: 'Yawarpi Oxígeno Huntay (SpO2) [Verify: SpO2]',
      pt: 'Saturação de Oxigênio (SpO2)',
      fr: 'Saturation en Oxygène (SpO2)',
      de: 'Sauerstoffsättigung (SpO2)',
      ja: '酸素飽和度 (SpO2)',
      zh: '血氧饱和度 (SpO2)',
    },
  },
  {
    term: 'Blood Pressure (mmHg)',
    explanation: 'Arterial systolic/diastolic pressure in millimeters of mercury. MAP ≈ DBP + (SBP - DBP) / 3.',
    translations: {
      en: 'Blood Pressure (mmHg)',
      es: 'Presión Arterial (mmHg)',
      qu: 'Yawarninchikpa Kallpan (mmHg) [Verify: mmHg]',
      pt: 'Pressão Arterial (mmHg)',
      fr: 'Pression Artérielle (mmHg)',
      de: 'Blutdruck (mmHg)',
      ja: '血圧 (mmHg)',
      zh: '血压 (mmHg)',
    },
  },
  {
    term: 'Microgravity',
    explanation: 'Condition in orbital freefall where apparent gravitational load is near zero, causing fluid shifts and musculoskeletal unloading.',
    translations: {
      en: 'Microgravity',
      es: 'Microgravedad',
      qu: 'Pisi Llasaq Pacha (Microgravedad) [Verify]',
      pt: 'Microgravidade',
      fr: 'Microgravité',
      de: 'Mikrogravitation',
      ja: '微小重力',
      zh: '微重力',
    },
  },
  {
    term: 'Sleep & Recovery',
    explanation: 'Circadian sleep duration, patterns, and physiological restoration under orbital light-dark cycles.',
    translations: {
      en: 'Sleep & Recovery',
      es: 'Sueño y Recuperación',
      qu: 'Puñuy hinaspa Kallpanchakuy',
      pt: 'Sono e Recuperação',
      fr: 'Sommeil et Récupération',
      de: 'Schlaf & Erholung',
      ja: '睡眠と回復',
      zh: '睡眠与恢复',
    },
  },
  {
    term: 'Body Temperature (°C)',
    explanation: 'Core or tympanic thermal reading in degrees Celsius using a calibrated thermometer.',
    translations: {
      en: 'Body Temperature (°C)',
      es: 'Temperatura Corporal (°C)',
      qu: 'Ukunchikpa Rupaynin (°C) [Verify: °C]',
      pt: 'Temperatura Corporal (°C)',
      fr: 'Température Corporelle (°C)',
      de: 'Körpertemperatur (°C)',
      ja: '体温 (°C)',
      zh: '体温 (°C)',
    },
  },
];

export function translateOfflineText(
  text: string,
  targetLang: LanguageCode
): { translated: string; usedGlossary: boolean; note?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { translated: '', usedGlossary: false };

  const match = OFFLINE_MEDICAL_GLOSSARY.find(
    (entry) =>
      entry.term.toLowerCase() === trimmed.toLowerCase() ||
      Object.values(entry.translations).some((t) => t.toLowerCase() === trimmed.toLowerCase())
  );

  if (match) {
    return {
      translated: match.translations[targetLang],
      usedGlossary: true,
      note:
        targetLang === 'qu'
          ? 'Ayacucho Quechua medical terminology note: technical symbols/units preserved.'
          : undefined,
    };
  }

  return {
    translated: trimmed,
    usedGlossary: false,
    note: 'Offline dictionary matched core medical terms only. Dynamic full-sentence translation requires server-side Gemini translation API when configured.',
  };
}
