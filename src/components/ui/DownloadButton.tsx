'use client';

import { Button } from './Button';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  filename: string;
  content: string;
}

export function DownloadButton({ filename, content }: DownloadButtonProps) {
  const handleDownload = () => {
    // Create a blob from the content
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body, click, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the object URL
    URL.revokeObjectURL(url);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-6 px-2 text-[10px]"
      onClick={handleDownload}
    >
      <Download className="w-3 h-3 mr-1" /> Download
    </Button>
  );
}
