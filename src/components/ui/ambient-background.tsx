"use client";

import { useEffect, useMemo, useState } from "react";

type Particle = {
  left: string;
  top: string;
  size: string;
  opacity: string;
  duration: string;
  delay: string;
  drift: string;
};

// Deterministic set so server render and client hydration stay identical.
const PARTICLES: Particle[] = [
  { left: "8%", top: "18%", size: "3px", opacity: "0.5", duration: "14s", delay: "0s", drift: "110px" },
  { left: "16%", top: "72%", size: "2px", opacity: "0.4", duration: "18s", delay: "2s", drift: "90px" },
  { left: "24%", top: "38%", size: "2px", opacity: "0.35", duration: "16s", delay: "4s", drift: "130px" },
  { left: "31%", top: "86%", size: "3px", opacity: "0.45", duration: "20s", delay: "1s", drift: "80px" },
  { left: "38%", top: "12%", size: "2px", opacity: "0.3", duration: "15s", delay: "6s", drift: "120px" },
  { left: "46%", top: "58%", size: "2px", opacity: "0.4", duration: "17s", delay: "3s", drift: "100px" },
  { left: "54%", top: "30%", size: "3px", opacity: "0.5", duration: "19s", delay: "5s", drift: "140px" },
  { left: "61%", top: "79%", size: "2px", opacity: "0.35", duration: "16s", delay: "0.5s", drift: "95px" },
  { left: "68%", top: "22%", size: "2px", opacity: "0.4", duration: "18s", delay: "7s", drift: "115px" },
  { left: "75%", top: "62%", size: "3px", opacity: "0.45", duration: "21s", delay: "2.5s", drift: "105px" },
  { left: "83%", top: "14%", size: "2px", opacity: "0.3", duration: "15s", delay: "8s", drift: "125px" },
  { left: "90%", top: "48%", size: "2px", opacity: "0.4", duration: "17s", delay: "1.5s", drift: "90px" },
  { left: "12%", top: "90%", size: "2px", opacity: "0.35", duration: "19s", delay: "3.5s", drift: "110px" },
  { left: "50%", top: "6%", size: "3px", opacity: "0.45", duration: "18s", delay: "6.5s", drift: "135px" },
  { left: "71%", top: "92%", size: "2px", opacity: "0.4", duration: "16s", delay: "0.8s", drift: "100px" },
  { left: "35%", top: "48%", size: "2px", opacity: "0.3", duration: "20s", delay: "9s", drift: "120px" },
];

const GLOWS = [
  { key: "bg-base-glow", placement: "top-[-20%] left-[-10%]" },
  { key: "bg-teal-glow", placement: "top-[-15%] right-[-10%]" },
  { key: "bg-violet-glow", placement: "bottom-[-25%] left-[20%]" },
];

const MATH_SYMBOLS =
  "αβγδεζηθικλμνξοπρστυφχψω" +
  "∑∏∫√∞≈≠≤≥±×÷∂∇⊕⊗⊙" +
  "0123456789∰∯∭" +
  "∞∂∇∫∯∰∭⊕⊗⊙" +
  "≤≥≠≈≅≡∝" +
  "⟨⟩∀∃∵∴∴¬∧∨" +
  "ℏ℘ℑℜ″‴";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function buildColumnChars(seed: number, count: number): string[] {
  const chars: string[] = [];
  for (let i = 0; i < count; i++) {
    chars.push(MATH_SYMBOLS[Math.floor(seededRandom(seed * 1000 + i) * MATH_SYMBOLS.length)]);
  }
  return chars;
}

const COLUMNS = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  left: `${(i / 40) * 100}%`,
  speed: 8 + seededRandom(i + 1) * 14,
  opacity: 0.04 + seededRandom(i + 100) * 0.1,
  charCount: 18 + Math.floor(seededRandom(i + 200) * 16),
  charSize: seededRandom(i + 300) > 0.5 ? 15 : 12,
  delay: seededRandom(i + 400) * -12,
  chars: [] as string[],
}));
COLUMNS.forEach((c) => { c.chars = buildColumnChars(c.id + 1, c.charCount); });

export function AmbientBackground() {
  const particles = useMemo(() => PARTICLES, []);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Pre-compute matrix rain data on client only (avoids hydration mismatch)
  const matrixRain = useMemo(() => {
    if (!mounted) return null;
    return COLUMNS.map((col) => ({
      ...col,
      charOpacities: col.chars.map((_, ci) =>
        0.12 + seededRandom(col.id * 100 + ci) * 0.88
      ),
    }));
  }, [mounted]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 isolate"
    >
      {/* 1. Deep atmospheric base */}
      <div className="absolute inset-0 bg-background" />

      {/* 2. Soft radial gradients */}
      <div className="absolute inset-0 bg-radial-gradients" />

      {/* 3. Subtle colored ambient glows */}
      {GLOWS.map((g) => (
        <span key={g.key} className={`ambient-glow ${g.placement}`} />
      ))}

      {/* 3b. Blurred light fields (soft, slow breathing) */}
      <span className="ambient-field field-a" />
      <span className="ambient-field field-b" />

      {/* 6. Matrix rain (falling math/Greek symbols behind content) */}
      {matrixRain && (
        <div className="absolute inset-0 overflow-hidden">
          {matrixRain.map((col) => (
            <div
              key={col.id}
              className="matrix-col"
              style={
                {
                  left: col.left,
                  animationDuration: `${col.speed}s`,
                  animationDelay: `${col.delay}s`,
                } as React.CSSProperties
              }
            >
              {col.chars.map((ch, ci) => (
                <span
                  key={ci}
                  className="matrix-char"
                  style={{
                    opacity: col.charOpacities[ci],
                    fontSize: col.charSize,
                  }}
                >
                  {ch}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 4. Very fine grain/noise */}
      <div className="ambient-grain absolute inset-0" />

      {/* 5. Floating particles */}
      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <span
            key={i}
            className="ambient-particle"
            style={
              {
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                "--p-opacity": p.opacity,
                "--p-duration": p.duration,
                "--p-delay": p.delay,
                "--p-drift": p.drift,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
