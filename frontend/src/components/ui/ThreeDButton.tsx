/**
 * Componente base para todos los botones 3D de la aplicación.
 * Variantes disponibles:
 *  - primary: degradado intenso con glow azul.
 *  - secondary: base clara con borde y reflejo suave.
 *  - ghost: fondo translúcido para acciones menos prioritarias.
 *
 * Tamaños disponibles: sm, md, lg (altura y tipografía adaptada).
 * Puede renderizar como <button> o <a> mediante la prop `as`.
 * `showOrb` añade una animación orbital mediante Babylon (ButtonOrb).
 */
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { ButtonOrb } from '../3d/ButtonOrb';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface SharedThreeDButtonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  showOrb?: boolean;
  orbColor?: {
    primary: string;
    accent: string;
  };
}

type ButtonThreeDProps = SharedThreeDButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' };

type AnchorThreeDProps = SharedThreeDButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href: string };

type ThreeDButtonProps = ButtonThreeDProps | AnchorThreeDProps;

const variantClasses: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-r from-primary-500 via-primary-600 to-blue-500 shadow-[0_12px_40px_-15px_rgba(37,99,235,0.8)] hover:shadow-[0_20px_50px_-15px_rgba(34,211,238,0.7)]',
  secondary:
    'text-primary-600 bg-white/90 border border-primary-100 shadow-[0_12px_30px_-15px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.4)]',
  ghost:
    'text-primary-500 bg-white/60 border border-white/50 shadow-inner hover:bg-white hover:text-primary-600',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-7 text-lg',
};

function renderContent({
  children,
  size,
  icon,
  loading,
  showOrb,
  orbColor,
}: Pick<ThreeDButtonProps, 'children' | 'size' | 'icon' | 'loading' | 'showOrb' | 'orbColor'>) {
  return (
    <>
      <span className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-primary-500/20 mix-blend-overlay" />

      <span className="relative flex items-center gap-3">
        {loading ? (
          <span className="flex h-5 w-5 items-center justify-center">
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
          </span>
        ) : (
          (showOrb || icon) && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              {showOrb ? (
                <ButtonOrb
                  size={size === 'lg' ? 28 : size === 'sm' ? 22 : 24}
                  primaryColor={orbColor?.primary ?? '#2563eb'}
                  accentColor={orbColor?.accent ?? '#38bdf8'}
                  className="h-full w-full"
                />
              ) : (
                icon
              )}
            </span>
          )
        )}

        <span className="relative whitespace-nowrap">{children}</span>
      </span>
    </>
  );
}

export function ThreeDButton(props: ThreeDButtonProps) {
  const {
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    showOrb,
    orbColor,
    ...rest
  } = props;

  const baseClasses = [
    'group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/60 disabled:pointer-events-none disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(' ');

  if (props.as === 'a') {
    const { as: _as, loading: _loading, ...anchorProps } = rest as AnchorThreeDProps;
    return (
      <a className={baseClasses} {...anchorProps}>
        {renderContent({ children, size, icon, loading, showOrb, orbColor })}
      </a>
    );
  }

  const { as: _as, disabled, ...buttonProps } = rest as ButtonThreeDProps;
  const isDisabled = disabled || loading;

  return (
    <button
      className={baseClasses}
      disabled={isDisabled}
      {...buttonProps}
    >
      {renderContent({ children, size, icon, loading, showOrb, orbColor })}
    </button>
  );
}


