import { useRef } from 'react';
import type React from 'react';

interface Options {
  onLeft?: () => void;
  onRight?: () => void;
  onTap?: () => void;
  threshold?: number;
}

/** Pointer-based horizontal swipe + tap detection for touch devices. */
export function useSwipe({ onLeft, onRight, onTap, threshold = 60 }: Options) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const dt = Date.now() - s.t;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800) {
      if (dx < 0) onLeft?.();
      else onRight?.();
      return;
    }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 400) {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, select, [data-no-tap]')) return;
      onTap?.();
    }
  };

  return { onPointerDown, onPointerUp };
}
