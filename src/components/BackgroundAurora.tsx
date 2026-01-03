"use client";

import React from "react";

export default function BackgroundAurora() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes float1 {
          0% { transform: translate3d(-6%, -4%, 0) scale(1); }
          50% { transform: translate3d(6%, 4%, 0) scale(1.05); }
          100% { transform: translate3d(-6%, -4%, 0) scale(1); }
        }
        @keyframes float2 {
          0% { transform: translate3d(8%, -6%, 0) scale(1); }
          50% { transform: translate3d(-8%, 6%, 0) scale(1.06); }
          100% { transform: translate3d(8%, -6%, 0) scale(1); }
        }
        @keyframes sweep {
          0% { transform: translateX(-30%) skewX(-12deg); opacity: .10; }
          50% { opacity: .20; }
          100% { transform: translateX(30%) skewX(-12deg); opacity: .10; }
        }
      `}</style>

      {/* Base: leggero scurimento per un look più moderno */}
      <div className="absolute inset-0 bg-[rgba(6,7,10,0.22)]" />

      {/* Aurora: single high-quality static gradient (dark + blue + lime) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,6,15,0.92) 0%, rgba(3,6,15,0.78) 100%)," +
            "radial-gradient(circle at 28% 25%, rgba(47,127,216,0.36) 0%, rgba(47,127,216,0.18) 30%, rgba(47,127,216,0.06) 55%, rgba(47,127,216,0) 80%)," +
            "radial-gradient(circle at 72% 62%, rgba(184,255,44,0.20) 0%, rgba(184,255,44,0.10) 28%, rgba(184,255,44,0) 60%)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundBlendMode: "screen, normal, normal",
          willChange: "opacity, transform",
          transform: "translateZ(0)",
        }}
      />

      {/* Vignette per leggibilità: opacità ridotte per non oscurare l'aurora */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 50% 15%, rgba(0,0,0,0.14), transparent 60%)," +
            "linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.42))",
        }}
      />
    </div>
  );
}
