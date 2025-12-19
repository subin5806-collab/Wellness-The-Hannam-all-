
import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1A362E';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      
      // 컨테이너 크기에 맞춰 내부 해상도 조정
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        // 리사이즈 후 컨텍스트 설정 재적용 필요
        const newCtx = canvas.getContext('2d');
        if (newCtx) {
          newCtx.strokeStyle = '#1A362E';
          newCtx.lineWidth = 3;
          newCtx.lineCap = 'round';
          newCtx.lineJoin = 'round';
        }
      };
      
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      // 그릴 때마다 즉시 상태를 부모에게 전달하여 버튼 활성화 상태 업데이트
      onSave(canvas.toDataURL());
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      onClear();
    }
  };

  return (
    <div className="relative w-full h-full bg-white rounded-xl border-2 border-gray-100 overflow-hidden group shadow-inner">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button
        type="button"
        onClick={handleClear}
        className="absolute bottom-4 right-4 p-3 bg-white border border-gray-100 rounded-lg text-gray-300 hover:text-red-500 shadow-md transition-all z-20"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      {!hasDrawn && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <p className="text-sm font-serif italic text-hannam-green tracking-widest uppercase">Sign Here to Authorize</p>
        </div>
      )}
    </div>
  );
};
