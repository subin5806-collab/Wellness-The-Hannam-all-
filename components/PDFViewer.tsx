
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Worker 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

interface PDFViewerProps {
  url: string;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPdf = async () => {
      if (!url || !containerRef.current) return;
      setLoading(true);
      
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);
        
        containerRef.current.innerHTML = ''; // 초기화

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 }); // 고해상도 렌더링
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = "w-full mb-4 shadow-md rounded-sm bg-white";
            
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            containerRef.current.appendChild(canvas);
          }
        }
      } catch (error) {
        console.error("PDF load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [url]);

  return (
    <div className={`relative bg-gray-100 p-4 overflow-y-auto ${className} no-scrollbar`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-hannam-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rendering Digital Form...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="max-w-[800px] mx-auto" />
    </div>
  );
};
