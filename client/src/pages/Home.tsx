import { useAuth } from "@/hooks/use-auth";
import { useQada } from "@/hooks/use-qada";
import Dashboard from "./Dashboard";
import Setup from "./Setup";
import Landing from "./Landing";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: qada, isLoading: qadaLoading } = useQada();

  if (authLoading || (isAuthenticated && qadaLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Landing Page
  if (!isAuthenticated) {
    return <Landing />;
  }

  // Logged in but no data -> Setup
  if (!qada) {
    return <Setup />;
  }

  // Logged in and has data -> Dashboard
  return <Dashboard />;
}
