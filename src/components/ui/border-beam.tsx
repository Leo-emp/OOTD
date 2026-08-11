"use client";

// ── BorderBeam ──
// Animated light beam that travels along a container's border
// From MagicUI — used on premium cards for subtle interactive borders
// Adapted colors for OOTD AI brand palette

import { motion, type MotionStyle, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  transition?: Transition;
  className?: string;
  style?: React.CSSProperties;
  reverse?: boolean;
  initialOffset?: number;
  borderWidth?: number;
}

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#C084FC",
  colorTo = "#FF6B9D",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
}: BorderBeamProps) => {
  return (
    // Outer mask clips the beam to just the border area
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        border: `${borderWidth}px solid transparent`,
        mask: "linear-gradient(transparent,transparent),linear-gradient(#000,#000)",
        maskComposite: "exclude",
        WebkitMaskComposite: "xor",
        maskClip: "padding-box,border-box",
        WebkitMask:
          "linear-gradient(transparent,transparent),linear-gradient(#000,#000)",
        WebkitMaskClip: "padding-box,border-box",
      }}
    >
      {/* Animated beam element — travels around the border path */}
      <motion.div
        className={cn(
          "absolute aspect-square",
          className
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
            ...style,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  );
};
