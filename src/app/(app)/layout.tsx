import { NavBar } from "@/components/layout/NavBar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Layout for authenticated app pages — includes bottom nav bar + error boundary
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <NavBar />
    </div>
  );
}
