import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -mb-64 pointer-events-none" />

      {/* Content centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[400px]">
          {/* Logo Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-24 w-24 mb-6 relative">
              <img 
                src="/logo.png" 
                alt="Dail Elite Logo" 
                className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(220,38,38,0.2)]" 
              />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              DAIL <span className="text-brand">Nutrition</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] mt-2">Sincronización Biométrica</p>
          </div>
          
          {children}
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-8 text-center">
        <p className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">DAIL Nutrition Core v2.0 // Operativo</p>
      </footer>
    </div>
  );
}
