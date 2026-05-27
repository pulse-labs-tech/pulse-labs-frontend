import React from "react";

interface LineIconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  className?: string;
  variant?: "line" | "solid";
}

export function LineIcon({ name, className = "", variant = "line", ...props }: LineIconProps) {
  return <i className={`lni lni-${name} ${className}`} {...props} />;
}
