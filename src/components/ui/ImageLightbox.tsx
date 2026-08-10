"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

// Premium image lightbox — tap any item photo to get full-screen zoom
// Supports pinch-to-zoom on mobile + scroll zoom on desktop
// Used in OutfitCard and outfit detail page for fabric inspection
export function ImageLightbox({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  // Render prop — the trigger element that opens the lightbox
  children: (open: () => void) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  // Track last pinch distance for mobile zoom
  const lastPinchDistance = useRef(0);
  // Track drag start position
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Open lightbox — reset zoom and position
  const open = useCallback(() => {
    setIsOpen(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Close lightbox
  const close = useCallback(() => {
    setIsOpen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom in/out with limits (1x to 4x)
  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.5, 4)), []);
  const zoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      // Reset position when zooming out to 1x
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom on desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    setScale((s) => {
      const next = Math.max(1, Math.min(s + delta, 4));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Touch pinch-to-zoom for mobile — calculates distance between two fingers
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two-finger pinch
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (lastPinchDistance.current > 0) {
        const delta = (distance - lastPinchDistance.current) * 0.01;
        setScale((s) => {
          const next = Math.max(1, Math.min(s + delta, 4));
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      }
      lastPinchDistance.current = distance;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = 0;
  }, []);

  // Pan when zoomed in — mouse drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [scale, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || scale <= 1) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: dragStart.current.posX + dx,
      y: dragStart.current.posY + dy,
    });
  }, [isDragging, scale]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double-tap to zoom toggle
  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  }, [scale, resetZoom]);

  return (
    <>
      {children(open)}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={(e) => {
              // Close on backdrop click (not on image)
              if (e.target === e.currentTarget) close();
            }}
          >
            {/* Backdrop — dark blur */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            {/* Zoom controls — top bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-4">
              {/* Image name */}
              <p className="text-sm text-white/60 truncate max-w-[60%]">{alt}</p>

              {/* Control buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomOut}
                  disabled={scale <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition disabled:opacity-30 cursor-pointer"
                  aria-label="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs text-white/60 font-mono w-10 text-center">
                  {scale.toFixed(1)}x
                </span>
                <button
                  onClick={zoomIn}
                  disabled={scale >= 4}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition disabled:opacity-30 cursor-pointer"
                  aria-label="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={resetZoom}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition cursor-pointer"
                  aria-label="Reset zoom"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition cursor-pointer ml-2"
                  aria-label="Close lightbox"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Image container — handles zoom + pan */}
            <motion.div
              className="relative w-full h-full flex items-center justify-center select-none"
              onWheel={handleWheel}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
              style={{
                cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                touchAction: "none",
              }}
            >
              <motion.div
                animate={{
                  scale,
                  x: position.x,
                  y: position.y,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative max-w-[90vw] max-h-[85vh] w-full h-full"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  quality={95}
                  priority
                  draggable={false}
                />
              </motion.div>
            </motion.div>

            {/* Bottom hint */}
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/30">
              {scale > 1 ? "Drag to pan · Double-click to reset" : "Scroll or pinch to zoom · Double-click for 2.5x"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
