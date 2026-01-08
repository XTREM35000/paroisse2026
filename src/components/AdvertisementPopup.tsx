import React, { useEffect, useState, useRef } from 'react';
import type { PublicAd } from '@/types/advertisements';
import { X } from 'lucide-react';

interface AdPopupProps {
  ad: PublicAd;
  onClose: () => void;
}

export default function AdvertisementPopup({ ad, onClose }: AdPopupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const seenKey = `ad-seen-${ad.id}`;

  useEffect(() => {
    console.log('AdvertisementPopup mounted with ad:', ad?.title);
  }, [ad?.id]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag if clicking on the header
    if ((e.target as HTMLElement).closest('.popup-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    console.log(`Closing advertisement popup: ${ad?.title}`);
    try {
      localStorage.setItem(seenKey, Date.now().toString());
    } catch (e) {
      console.error('Failed to save seen state:', e);
    }
    setIsVisible(false);
    onClose();
  };

  if (!isVisible || !ad) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-300"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 overflow-hidden"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Draggable Header */}
        <div className="popup-header bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between cursor-grab active:cursor-grabbing">
          <h2 className="text-xl font-bold text-white truncate">{ad.title}</h2>
          <button
            onClick={handleClose}
            className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors ml-2 flex-shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Image */}
        <div className="w-full h-40 overflow-hidden bg-gray-200">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-5">
          {ad.subtitle && (
            <p className="text-sm font-semibold text-blue-600 mb-2">{ad.subtitle}</p>
          )}
          
          {ad.content && (
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{ad.content}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="flex-1 px-3 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded transition-colors text-sm"
            >
              Fermer
            </button>
            
            {ad.pdf_url && (
              <a href={ad.pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem(seenKey, Date.now().toString());
                    } catch (e) {
                      console.error('Failed to save seen state:', e);
                    }
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  PDF
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
