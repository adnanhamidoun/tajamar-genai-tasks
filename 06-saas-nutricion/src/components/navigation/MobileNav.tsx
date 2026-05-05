"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, User, Camera, Dumbbell } from "lucide-react";
import SnapModal from "@/components/snap/SnapModal";
import ActivityModal from "@/components/activity/ActivityModal";

export function MobileNav() {
  const pathname = usePathname();
  const [snapOpen, setSnapOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-md">
        <div className="bg-zinc-950/80 backdrop-blur-2xl border border-white/5 rounded-[32px] h-20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center px-4 relative overflow-hidden">
          
          <div className="flex-1 grid grid-cols-5 h-full">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center justify-center transition-all ${
                pathname === "/dashboard" ? "text-red-500" : "text-zinc-600 hover:text-white"
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${pathname === "/dashboard" ? "bg-red-500/10" : ""}`}>
                <Home className="h-6 w-6" />
              </div>
            </Link>

            <Link
              href="/history"
              className={`flex flex-col items-center justify-center transition-all ${
                pathname === "/history" ? "text-red-500" : "text-zinc-600 hover:text-white"
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${pathname === "/history" ? "bg-red-500/10" : ""}`}>
                <History className="h-6 w-6" />
              </div>
            </Link>

            {/* Center SNAP Button - BACK TO RED */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => setSnapOpen(true)}
                className="
                  h-14 w-14 rounded-2xl
                  bg-[#E62020]
                  shadow-[0_0_30px_rgba(230,32,32,0.4)]
                  flex items-center justify-center
                  active:scale-90
                  transition-all duration-300
                  group
                  border border-white/10
                  relative z-10
                "
              >
                <Camera className="h-7 w-7 text-white" />
              </button>
            </div>

            <button
              onClick={() => setActivityOpen(true)}
              className={`flex flex-col items-center justify-center transition-all ${
                activityOpen ? "text-red-500" : "text-zinc-600 hover:text-white"
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${activityOpen ? "bg-red-500/10" : ""}`}>
                <Dumbbell className="h-6 w-6" />
              </div>
            </button>

            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center transition-all ${
                pathname === "/profile" ? "text-red-500" : "text-zinc-600 hover:text-white"
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${pathname === "/profile" ? "bg-red-500/10" : ""}`}>
                <User className="h-6 w-6" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <SnapModal open={snapOpen} onOpenChange={setSnapOpen} />
      <ActivityModal open={activityOpen} onOpenChange={setActivityOpen} />
    </>
  );
}
