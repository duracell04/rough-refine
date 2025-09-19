interface LogoProps {
  className?: string;
  size?: number;
  showRough?: boolean;
}

export function Logo({ className = "", size = 192, showRough = true }: LogoProps) {
  const strokeWidth = Math.max(2, size / 12); // Responsive stroke width
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RoughRefine Logo"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      style={{ 
        color: 'hsl(var(--ink))',
        '--sw': strokeWidth,
        '--rough-color': 'hsl(var(--rough))'
      } as any}
    >
      <title>RoughRefine</title>
      <desc>Sketch fast. Refine precisely. Export clean SVG.</desc>
      
      {/* Rough layer - optional */}
      {showRough && (
        <g
          fill="none"
          stroke="var(--rough-color)"
          strokeWidth="var(--sw)"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="18 10"
          opacity="0.7"
          transform="translate(-12, 0)"
        >
          {/* Stem */}
          <line x1="160" y1="96" x2="160" y2="416" />
          {/* Bowl */}
          <path d="M160,128 H272 A112,112 0 0 1 160,240" />
          {/* Leg */}
          <path d="M160,240 L336,416" />
        </g>
      )}
      
      {/* Refined layer */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="var(--sw)"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      >
        {/* Stem */}
        <line x1="160" y1="96" x2="160" y2="416" />
        {/* Bowl */}
        <path d="M160,128 H272 A112,112 0 0 1 160,240" />
        {/* Leg */}
        <path d="M160,240 L336,416" />
      </g>
    </svg>
  );
}