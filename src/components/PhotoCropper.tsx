import React, { useEffect, useRef, useState } from 'react';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';

// Round crop of a profile photo: drag to position, slider to zoom.
// Returns a small JPEG (320x320) so the photo syncs fast and does not bloat the database.

const VIEW = 260; // crop area size on screen (px)
const OUTPUT = 320; // saved image size (px)

interface Props {
  src: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}

export const PhotoCropper: React.FC<Props> = ({ src, onCancel, onSave }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image top-left relative to the crop area
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = src;
  }, [src]);

  const baseScale = img ? Math.max(VIEW / img.width, VIEW / img.height) : 1;
  const w = img ? img.width * baseScale * zoom : VIEW;
  const h = img ? img.height * baseScale * zoom : VIEW;

  // Keeps the crop area always covered by the image
  const clamp = (x: number, y: number) => ({
    x: Math.min(0, Math.max(VIEW - w, x)),
    y: Math.min(0, Math.max(VIEW - h, y))
  });

  // Centers the image when it loads
  useEffect(() => {
    if (img) setPos({ x: (VIEW - img.width * baseScale) / 2, y: (VIEW - img.height * baseScale) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  const changeZoom = (next: number) => {
    const z = Math.min(3, Math.max(1, next));
    // zoom around the center of the crop area
    const cx = VIEW / 2 - pos.x;
    const cy = VIEW / 2 - pos.y;
    const k = z / zoom;
    const nw = (img ? img.width * baseScale : VIEW) * z;
    const nh = (img ? img.height * baseScale : VIEW) * z;
    const nx = VIEW / 2 - cx * k;
    const ny = VIEW / 2 - cy * k;
    setZoom(z);
    setPos({ x: Math.min(0, Math.max(VIEW - nw, nx)), y: Math.min(0, Math.max(VIEW - nh, ny)) });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const d = drag.current;
    setPos(clamp(d.origX + e.clientX - d.startX, d.origY + e.clientY - d.startY));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const handleSave = () => {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const r = OUTPUT / VIEW;
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.drawImage(img, pos.x * r, pos.y * r, w * r, h * r);
    onSave(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#2C2C2C]">Ajustar foto</h3>
            <p className="text-[11px] text-[#8C7A6B]">Arraste para posicionar e use o zoom para cortar</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
            aria-label="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-full bg-[#EFE8DE] touch-none cursor-grab active:cursor-grabbing ring-4 ring-[#EFE8DE]"
            style={{ width: VIEW, height: VIEW }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {img ? (
              <img
                src={src}
                alt="Prévia da foto"
                draggable={false}
                className="absolute max-w-none select-none pointer-events-none"
                style={{ left: pos.x, top: pos.y, width: w, height: h }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-[#8C7A6B]">Carregando...</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <button onClick={() => changeZoom(zoom - 0.2)} className="text-[#8C7A6B]" aria-label="Diminuir zoom">
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => changeZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#8C7A6B]"
            aria-label="Zoom"
          />
          <button onClick={() => changeZoom(zoom + 0.2)} className="text-[#8C7A6B]" aria-label="Aumentar zoom">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            className="py-2.5 rounded-2xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#5C4F44] text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!img}
            className="py-2.5 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Salvar foto
          </button>
        </div>
      </div>
    </div>
  );
};
