"use client";

import { Camera, Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({
  onClick,
}: FloatingActionButtonProps) {
  return (
    <>
      {/* Mobile FAB — fixed bottom-right */}
      <button
        id="fab-snap-meal"
        onClick={onClick}
        className="
          fixed bottom-6 right-6 z-40
          md:hidden
          h-16 w-16 rounded-lg
          dail-gradient
          shadow-lg shadow-red-500/30
          flex items-center justify-center
          active:scale-95
          transition-all duration-200
          hover:shadow-xl hover:shadow-red-500/40
          group
        "
        aria-label="Snap Meal — Fotografiar comida"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-lg dail-gradient opacity-50 animate-ping" />
        <span className="relative flex items-center justify-center">
          <Plus className="h-7 w-7 text-white group-active:rotate-45 transition-transform duration-200" />
        </span>
      </button>

      {/* Desktop CTA — inline button in header area */}
      <button
        id="desktop-snap-meal"
        onClick={onClick}
        className="
          hidden md:flex
          items-center gap-2.5
          px-5 py-2.5 rounded-lg
          dail-gradient
          text-white font-semibold text-sm
          shadow-md shadow-red-500/20
          hover:shadow-lg hover:shadow-red-500/30
          active:scale-[0.97]
          transition-all duration-200
        "
      >
        <Camera className="h-4.5 w-4.5" />
        Snap Meal
      </button>
    </>
  );
}
