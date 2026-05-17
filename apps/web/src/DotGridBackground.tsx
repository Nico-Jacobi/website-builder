import { useEffect, useRef } from 'react';

// Base dot color — dark muted blue matching project palette
const DOT  = { r: 100, g: 100, b: 100 };
const GLOW = { r: 160, g: 160, b: 160 };
const BG   = '#0b0d12';

const SPACING       = 50;
const BASE_SIZE     = 50;
const FALLOFF       = 2.5;
const RIPPLE_SPEED  = 180;
const RIPPLE_WIDTH  = 160;
const RIPPLE_PERIOD = 18;
const RIPPLE_TRAVEL = 14;
const RIPPLE_PULSE  = 2.5;
const RIPPLE_GLOW   = 0.7;
const GRID_OFFSET_X = 20;   // px, nudge grid horizontally
const GRID_OFFSET_Y = 20;   // px, nudge grid vertically

export default function DotGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let viewW = 0, viewH = 0;
    let cols = 0, rows = 0, offsetX = 0, offsetY = 0, maxDist = 1;

    function rebuildGrid() {
      cols    = Math.floor(viewW / SPACING);
      rows    = Math.floor(viewH / SPACING);
      offsetX = (viewW - cols * SPACING) / 2 + SPACING / 2 + GRID_OFFSET_X;
      offsetY = (viewH - rows * SPACING) / 2 + SPACING / 2 + GRID_OFFSET_Y;
      maxDist = Math.hypot(viewW, viewH);
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      canvas!.width  = viewW * dpr;
      canvas!.height = viewH * dpr;
      canvas!.style.width  = viewW + 'px';
      canvas!.style.height = viewH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildGrid();
    }

    window.addEventListener('resize', resize);
    resize();

    let rafId: number;

    function draw(tMs: number) {
      const t = tMs / 1000;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, viewW, viewH);

      const sMax     = viewW + viewH;
      const startOff = 4 * RIPPLE_WIDTH;
      const lifetime = (sMax + 2 * startOff) / RIPPLE_SPEED;
      const newest   = Math.floor(t / RIPPLE_PERIOD);
      const oldest   = Math.ceil((t - lifetime) / RIPPLE_PERIOD);
      const ripples: number[] = [];
      for (let i = oldest; i <= newest; i++) {
        ripples.push((t - i * RIPPLE_PERIOD) * RIPPLE_SPEED - startOff);
      }
      const inv2w2 = 1 / (2 * RIPPLE_WIDTH * RIPPLE_WIDTH);

      for (let y = -2; y <= rows + 2; y++) {
        for (let x = -2; x <= cols + 2; x++) {
          const cx = offsetX + x * SPACING;
          const cy = offsetY + y * SPACING;

          // Brightness fades from top-right toward bottom-left
          const fx = viewW - cx;
          const brightness = Math.max(0, Math.min(1, 1 - Math.hypot(fx, cy) / maxDist)) ** FALLOFF;
          if (brightness < 0.005) continue;

          let size = BASE_SIZE;
          let dx = 0, dy = 0, waveBump = 0;

          if (ripples.length) {
            const s = fx + cy;
            let bump = 0, signedDisp = 0;
            for (let k = 0; k < ripples.length; k++) {
              const dist = s - ripples[k];
              const g    = Math.exp(-(dist * dist) * inv2w2);
              bump       += g;
              signedDisp += -(dist / RIPPLE_WIDTH) * g;
            }
            waveBump = Math.min(1, bump);
            size    += bump * RIPPLE_PULSE * brightness;
            const travel = signedDisp * RIPPLE_TRAVEL * brightness;
            dx = travel * 0.7071;
            dy = travel * 0.7071;
          }

          const blend = waveBump * RIPPLE_GLOW * brightness;
          const cr = Math.round(DOT.r + (GLOW.r - DOT.r) * blend);
          const cg = Math.round(DOT.g + (GLOW.g - DOT.g) * blend);
          const cb = Math.round(DOT.b + (GLOW.b - DOT.b) * blend);
          const alpha = Math.min(1, brightness + blend * 0.4);

          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
          ctx.fillRect(cx + dx - size / 2, cy + dy - size / 2, size, size);
        }
      }
    }

    function loop(tMs: number) {
      draw(tMs);
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
