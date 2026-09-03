import Image from 'next/image';

interface LogoProps {
  variant?: 'light' | 'dark' | 'black';
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({
  variant = 'black',
  className = '',
  width = 120,
  height = 40
}: LogoProps) {
  return (
    <Image
      src={`/apu-logo-${variant}.svg`}
      alt="APU - Privacy-Preserving Medical AI"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}

interface LogoMarkProps {
  size?: 16 | 32 | 64 | 256 | 512 | 1024;
  className?: string;
}

export function LogoMark({ size = 32, className = '' }: LogoMarkProps) {
  return (
    <Image
      src={`/apu-mark-${size}.png`}
      alt="APU Mark"
      width={size}
      height={size}
      className={className}
    />
  );
}
