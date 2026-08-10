import { NavBar } from "@/components/layout/NavBar";

// Layout for authenticated app pages — includes bottom nav bar
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      {children}
      <NavBar />
    </div>
  );
}
