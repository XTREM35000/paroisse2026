import React from 'react';
import { Download } from 'lucide-react';

interface Props {
  href?: string; // URL publique
  filePath?: string; // storage path (used with useFileManager)
  fileName?: string;
  className?: string;
  onDownload?: () => Promise<void> | void;
  title?: string;
}

const DownloadButton: React.FC<Props> = ({ href, filePath, fileName, className = '', onDownload, title }) => {
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      await onDownload();
      return;
    }

    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.download = fileName || '';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    // Fallback: open in new tab
    if (filePath) {
      window.open(filePath, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center ${className}`}
      title={title || 'Télécharger'}
      aria-label="Télécharger"
    >
      <Download className="w-4 h-4" />
    </button>
  );
};

export default DownloadButton;
