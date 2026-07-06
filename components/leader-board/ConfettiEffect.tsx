"use client";

import { motion } from "framer-motion";

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
}

const particleColors = ["#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function ConfettiEffect() {
  const particles: ConfettiParticle[] = Array.from({ length: 90 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: Math.random() * -110 - 40,
    color: particleColors[Math.floor(Math.random() * particleColors.length)],
    size: Math.random() * 8 + 6,
    delay: Math.random() * 0.4,
    duration: Math.random() * 2 + 1.8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex items-end justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 50, scale: 0.2, rotate: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            x: `${p.x}vw`, 
            y: `${p.y}vh`, 
            scale: [0.2, 1, 1, 0.4],
            rotate: p.rotate * 3
          }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? "50%" : p.id % 3 === 1 ? "0%" : "30%",
          }}
        />
      ))}
    </div>
  );
}
