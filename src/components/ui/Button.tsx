import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'error';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  asChild = false,
  className = '',
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : 'button';
  const baseStyles = 'inline-flex items-center justify-center font-heading font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-md';
  
  const variants = {
    primary: 'bg-neon-cyan text-canvas hover:brightness-110 neon-glow-cyan',
    secondary: 'bg-surface-lvl2 text-neon-cyan border border-surface-overlay hover:bg-surface-overlay',
    ghost: 'bg-transparent text-neon-cyan border border-neon-cyan/30 hover:border-neon-cyan hover:bg-neon-cyan/10',
    error: 'bg-neon-error text-white hover:brightness-110',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <Comp
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </Comp>
  );
};
