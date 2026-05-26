import React, { useRef, useEffect, useCallback } from 'react';
import type { Stroke } from '../types';

interface Props {
  isDrawer: boolean;
  color: string;
  brushSize: number;
  onDrawStart: (data: { x: number; y: number; color: string; size: number }) => void;
  onDrawMove: (data: { x: number; y: number }) => void;
  onDrawEnd: () => void;
  externalStroke: Stroke | null;
  shouldClear: number;
  undoStrokeHistory: Stroke[] | null;
}

const CANVAS_W = 800;
const CANVAS_H = 500;

const Canvas: React.FC<Props> = ({
  isDrawer, color, brushSize,
  onDrawStart, onDrawMove, onDrawEnd,
  externalStroke, shouldClear, undoStrokeHistory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDown = useRef(false);
  const lastExternal = useRef<Stroke | null>(null);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? (e as React.TouchEvent).changedTouches[0].clientX;
      clientY = e.touches[0]?.clientY ?? (e as React.TouchEvent).changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    isDown.current = true;
    const { x, y } = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    onDrawStart({ x, y, color, size: brushSize });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDown.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    onDrawMove({ x, y });
  };

  const handleUp = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDown.current) return;
    e?.preventDefault();
    isDown.current = false;
    onDrawEnd();
  };

  // Process incoming strokes from server
  useEffect(() => {
    if (!externalStroke || isDrawer) return;
    if (externalStroke === lastExternal.current) return;
    lastExternal.current = externalStroke;

    const ctx = getCtx();
    if (!ctx) return;

    if (externalStroke.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(externalStroke.x!, externalStroke.y!);
      ctx.strokeStyle = externalStroke.color || '#000';
      ctx.lineWidth = externalStroke.size || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (externalStroke.type === 'move') {
      ctx.lineTo(externalStroke.x!, externalStroke.y!);
      ctx.stroke();
    } else if (externalStroke.type === 'end') {
      ctx.closePath();
    }
  }, [externalStroke, isDrawer]);

  // Clear canvas
  useEffect(() => {
    if (shouldClear <= 0) return;
    const ctx = getCtx();
    if (ctx) ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }, [shouldClear]);

  // Undo: redraw from stroke history
  const redrawAll = useCallback((strokes: Stroke[]) => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    for (const s of strokes) {
      if (s.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(s.x!, s.y!);
        ctx.strokeStyle = s.color || '#000';
        ctx.lineWidth = s.size || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (s.type === 'move') {
        ctx.lineTo(s.x!, s.y!);
        ctx.stroke();
      } else if (s.type === 'end') {
        ctx.closePath();
      }
    }
  }, []);

  useEffect(() => {
    if (undoStrokeHistory) {
      redrawAll(undoStrokeHistory);
    }
  }, [undoStrokeHistory, redrawAll]);

  return (
    <div className="canvas-wrapper card">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          cursor: isDrawer ? 'crosshair' : 'default',
          maxWidth: '100%',
          height: 'auto',
          touchAction: 'none',
        }}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={() => handleUp()}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        onTouchEnd={handleUp}
      />
    </div>
  );
};

export default Canvas;
