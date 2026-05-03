"use client";

import { motion } from "framer-motion";
import type { PresentationTheme } from "@/lib/presentation/types";

interface OrbitProps {
  data: Record<string, unknown>;
  theme: PresentationTheme;
}

export function OrbitVisualization({ data, theme }: OrbitProps) {
  const core = (data.core as string) ?? "Core";
  const satellites = (data.satellites as string[]) ?? [];
  const size = 380;
  const center = size / 2;
  const coreR = 60;
  const ring1R = 130;
  const ring2R = 185;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          width: ring1R * 2,
          height: ring1R * 2,
          border: `1px dashed ${theme.colors.text}10`,
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          width: ring2R * 2,
          height: ring2R * 2,
          border: `1px dashed ${theme.colors.text}0a`,
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Core */}
      <div style={{
        width: coreR * 2,
        height: coreR * 2,
        borderRadius: "50%",
        border: `3px solid ${theme.colors.gold}80`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `${theme.colors.bg}f0`,
        boxShadow: `0 0 60px ${theme.colors.gold}28`,
        zIndex: 2,
        textAlign: "center",
      }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: theme.colors.gold }}>{core}</span>
      </div>

      {/* Satellites */}
      {satellites.map((sat, i) => {
        const angle = (i / satellites.length) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? ring1R : ring2R;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const satColors = [theme.colors.violet, theme.colors.teal, theme.colors.blue, theme.colors.cyan, theme.colors.green, theme.colors.rose];
        const color = satColors[i % satColors.length]!;

        return (
          <motion.div
            key={sat}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              padding: "8px 13px",
              border: `1px solid ${color}40`,
              borderRadius: theme.radius.sm,
              background: theme.colors.surface,
              fontWeight: 600,
              fontSize: 11,
              color,
              whiteSpace: "nowrap",
              zIndex: 3,
            }}
          >
            {sat}
          </motion.div>
        );
      })}
    </div>
  );
}
