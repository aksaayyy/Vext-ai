'use client';

import { Button } from './Button';
import { Download, Loader2, Package } from 'lucide-react';
import { useState } from 'react';

interface FullPackButtonProps {
  shareId: string;
}

export function FullPackButton({ shareId }: FullPackButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/card/${shareId}/export`);
      if (!response.ok) throw new Error('Failed to download pack');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vext-full-pack-${shareId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Package className="w-4 h-4" />
      )}
      Download Full Pack
    </Button>
  );
}
