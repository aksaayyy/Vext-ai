'use client';

import { Button } from './Button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  content: string;
}

export function CopyButton({ content }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-6 px-2 text-[10px]"
      onClick={handleCopy}
    >
      {copied ? <Check className="w-3 h-3 mr-1 text-neon-green" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}
