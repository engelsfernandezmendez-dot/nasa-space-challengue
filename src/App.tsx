import { AppProvider, useAppContext } from './context/AppContext';
import { AppShell } from './components/AppShell';
import { AuthPortal, LoadingScreen } from './components/AuthScreens';
import { FloatingTranslator } from './components/FloatingTranslator';
import { LandingPage } from './components/LandingPage';

function KawsayNovaRoot() {
  const { user, loading, showLanding } = useAppContext();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {!user ? showLanding ? <LandingPage /> : <AuthPortal /> : <AppShell />}
      <FloatingTranslator />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <KawsayNovaRoot />
    </AppProvider>
  );
}
