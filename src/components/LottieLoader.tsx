import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';

interface LottieLoaderProps {
  text?: string;
  size?: number;
}

export const LottieLoader: React.FC<LottieLoaderProps> = ({
  text = 'Memuat diduitin...',
  size = 120
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: './loader-lottie.json'
    });

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3 select-none">
      <div
        ref={containerRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="drop-shadow-[3px_3px_0px_#121214]"
      />
      {text && (
        <div className="brutal-badge px-3 py-1.5 bg-[#A3E635] text-[#121214] text-[11px] font-black uppercase tracking-wider border-2 border-[#121214] shadow-[2px_2px_0px_#121214]">
          {text}
        </div>
      )}
    </div>
  );
};
