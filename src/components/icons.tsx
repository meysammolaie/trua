import type { SVGProps } from "react";

export function VerdantVaultLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12L12 3L21 12L12 21L3 12Z" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M12 21V12" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M12 3V12" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M21 12H12" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M3 12H12" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M8 16L12 12L16 16" stroke="hsl(var(--accent-foreground))" strokeWidth="1.5" />
    </svg>
  );
}
