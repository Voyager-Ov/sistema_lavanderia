import { Metadata } from 'next';
import "@/app/globals.css";

export const metadata: Metadata = {
  title: 'Super Admin - Sistema Lavandería',
  description: 'Panel de control central',
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="relative flex min-h-screen flex-col">
        {/* Background glow effects */}
        <div className="pointer-events-none fixed inset-0 flex justify-center bg-black">
          <div className="absolute top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-900/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] h-[400px] w-[400px] rounded-full bg-purple-900/20 blur-[120px]" />
        </div>
        
        <main className="flex-1 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
