import React from 'react';

interface TerminalProps {
  code: string;
  language?: string;
  className?: string;
}

export const Terminal = ({ code, language = 'bash', className = '' }: TerminalProps) => {
  return (
    <div className={`terminal-window ${className}`}>
      <pre className="font-code text-sm text-neon-cyan/90 leading-relaxed overflow-x-auto">
        <code className="block py-2">
          {code}
          <span className="inline-block w-2 h-4 bg-neon-cyan ml-1 animate-cursor align-middle" />
        </code>
      </pre>
    </div>
  );
};
