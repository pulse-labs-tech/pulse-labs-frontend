import { SVGProps } from "react";

interface VercelIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * VercelIcon component generated from thesvg.org
 * Icon slug: vercel
 */
export function VercelIcon({ size = 24, className = "", ...props }: VercelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 222"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pulse-icon shrink-0 ${className}`}
      {...props}
    >
            <path fill="#fff" d="m128 0 128 221.705H0z"/>
    </svg>
  );
}
