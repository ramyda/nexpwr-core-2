import React from "react";

interface NexpwrLogoProps {
  className?: string;
  size?: number;
}

/**
 * Nexpwr Logo Component
 * Using standard img tag for maximum reliability with the official PNG.
 */
export function NexpwrLogo({ className = "", size = 32 }: NexpwrLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Nexpwr Logo"
      width={size}
      height={size}
      className={`flex-shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
