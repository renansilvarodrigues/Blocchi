import React, { useEffect, useRef, useState } from 'react';
import { Box } from 'lucide-react';
import {
  getCachedPartThumbnail,
  requestPartThumbnail,
} from '../../ldraw/partThumbnailRenderer';

interface PartThumbnailProps {
  partId: string;
  partName: string;
  activeColorCode: number;
  className?: string;
}

export const PartThumbnail: React.FC<PartThumbnailProps> = ({
  partId,
  partName,
  activeColorCode,
  className = 'w-11 h-11',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );
  const requestKey = `${activeColorCode}:${partId}`;
  const [state, setState] = useState(() => ({
    key: requestKey,
    thumbnail: getCachedPartThumbnail(partId, activeColorCode) ?? null,
    failed: false,
  }));

  const isCurrentRequest = state.key === requestKey;
  const cachedThumbnail = getCachedPartThumbnail(partId, activeColorCode);
  const thumbnail = isCurrentRequest
    ? state.thumbnail
    : cachedThumbnail ?? null;
  const hasFailed = isCurrentRequest ? state.failed : false;

  useEffect(() => {
    if (isVisible) return;

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: '120px 0px', threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || hasFailed) return;

    const cached = getCachedPartThumbnail(partId, activeColorCode);
    if (cached || thumbnail) return;

    let isActive = true;

    requestPartThumbnail(partId, activeColorCode).then((dataUrl) => {
      if (!isActive) return;
      setState({ key: requestKey, thumbnail: dataUrl, failed: !dataUrl });
    });

    return () => {
      isActive = false;
    };
  }, [isVisible, thumbnail, hasFailed, partId, activeColorCode, requestKey]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-md border border-[#3b3b46] bg-gradient-to-b from-[#34343e] to-[#232329] shadow-inner shrink-0 ${className}`}
      aria-busy={!thumbnail && !hasFailed}
      title={`Miniatura 3D — ${partName}`}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={`Miniatura 3D da peça ${partName}`}
          className="w-full h-full object-contain p-0.5 select-none"
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Box
            size={14}
            className={
              hasFailed
                ? 'text-zinc-600'
                : 'text-zinc-500 opacity-60 animate-pulse'
            }
          />
        </div>
      )}
    </div>
  );
};
