import { useState, useEffect } from "react";
import { useQada } from "@/hooks/use-qada";
import Dashboard from "./Dashboard";
import Setup from "./Setup";
import Landing from "./Landing";

export default function Home() {
  const { data: qada, isLoading: qadaLoading } = useQada();
  const [route, setRoute] = useState<'default' | 'setup' | 'info'>('default');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#setup') setRoute('setup');
      else if (hash === '#info') setRoute('info');
      else setRoute('default');
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (qadaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (route === 'setup') {
    return <Setup />;
  }

  if (route === 'info') {
    return <Landing />;
  }

  if (!qada) {
    return <Landing />;
  }

  return <Dashboard />;
}
