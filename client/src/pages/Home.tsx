import { useState, useEffect } from "react";
import { useQada } from "@/hooks/use-qada";
import Dashboard from "./Dashboard";
import Setup from "./Setup";
import Landing from "./Landing";

export default function Home() {
  const { data: qada, isLoading: qadaLoading } = useQada();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    const handleHash = () => setShowSetup(window.location.hash === '#setup');
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

  if (!qada) {
    return showSetup ? <Setup /> : <Landing />;
  }

  return <Dashboard />;
}
