import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="bg-card p-8 rounded-3xl shadow-xl border border-border text-center max-w-md w-full">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 font-display">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The path you are looking for does not exist. It might have been moved or deleted.
        </p>
        <Link href="/">
          <a className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            Return Home
          </a>
        </Link>
      </div>
    </div>
  );
}
