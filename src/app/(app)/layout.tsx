import { NavBar } from "@/components/layout/NavBar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { OnboardingSplash } from "@/components/ui/OnboardingSplash";

// Layout for authenticated app pages — includes bottom nav, toast, error boundary, onboarding splash
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {/* Onboarding splash — plays once per session on first visit */}
      <OnboardingSplash />
      <div className="min-h-screen pb-20">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <NavBar />
      </div>
    </ToastProvider>
  );
}
