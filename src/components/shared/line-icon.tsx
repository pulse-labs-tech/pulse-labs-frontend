import React from "react";

interface LineIconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  className?: string;
  variant?: "line" | "solid";
}

export function LineIcon({ name, className = "", variant = "line", ...props }: LineIconProps) {
  const prefix = variant === "solid" ? "lnis lnis-" : "lni lni-";
  return <i className={`${prefix}${name} ${className}`} {...props} />;
}
