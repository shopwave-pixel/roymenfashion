import React from 'react';

interface RoyMenLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  height?: number | string;
  light?: boolean;
}

export const RoyMenLogo: React.FC<RoyMenLogoProps> = ({
  className = '',
  showTagline = true,
  size = 'md',
  height,
  light = false
}) => {
  // Determine dimensions based on size
  let svgHeight = '64px';
  if (size === 'sm') {
    svgHeight = '44px';
  } else if (size === 'md') {
    svgHeight = '64px';
  } else if (size === 'lg') {
    svgHeight = '120px';
  } else if (size === 'xl') {
    svgHeight = '180px';
  } else if (height) {
    svgHeight = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <svg
        viewBox="0 0 200 160"
        style={{ height: svgHeight, width: 'auto' }}
        className="w-auto select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* SHIELD ICON */}
        {/* Outer shield path */}
        <path
          d="M 65 15 L 100 7 L 135 15 C 135 48, 128 72, 100 85 C 72 72, 65 48, 65 15 Z"
          className={`${
            light 
              ? 'fill-white stroke-white' 
              : 'fill-black dark:fill-zinc-900 stroke-black dark:stroke-yellow-500/20'
          }`}
          strokeWidth="1.5"
        />
        
        {/* Inner white shield contour line */}
        <path
          d="M 70 19 L 100 12 L 130 19 C 130 46, 124 67, 100 78 C 76 67, 70 46, 70 19 Z"
          fill="none"
          className={`${
            light
              ? 'stroke-black'
              : 'stroke-white dark:stroke-yellow-500/80'
          }`}
          strokeWidth="1.5"
          strokeOpacity="0.9"
        />

        {/* Monogram RM */}
        <text
          x="100"
          y="54"
          textAnchor="middle"
          fontSize="36"
          fontWeight="bold"
          fontFamily="Georgia, 'Times New Roman', serif"
          className={`${
            light
              ? 'fill-black'
              : 'fill-white dark:fill-yellow-500'
          } font-serif tracking-tight`}
          letterSpacing="-2"
        >
          RM
        </text>

        {/* BRAND NAME: ROY MEN */}
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fontSize="24"
          fontWeight="900"
          fontFamily="Georgia, 'Times New Roman', serif"
          className={`${
            light
              ? 'fill-white'
              : 'fill-black dark:fill-white'
          } tracking-[0.25em]`}
        >
          ROY MEN
        </text>

        {showTagline && (
          <>
            {/* Tagline: WEAR CONFIDENCE */}
            <text
              x="100"
              y="142"
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="600"
              fontFamily="sans-serif"
              className={`${
                light
                  ? 'fill-zinc-300'
                  : 'fill-zinc-500 dark:fill-zinc-400'
              } tracking-[0.35em]`}
            >
              WEAR CONFIDENCE
            </text>

            {/* Left and Right Tagline Flanking Lines */}
            <line
              x1="18"
              y1="139"
              x2="45"
              y2="139"
              className={`${
                light
                  ? 'stroke-zinc-500'
                  : 'stroke-zinc-300 dark:stroke-zinc-800'
              }`}
              strokeWidth="0.8"
            />
            <line
              x1="155"
              y1="139"
              x2="182"
              y2="139"
              className={`${
                light
                  ? 'stroke-zinc-500'
                  : 'stroke-zinc-300 dark:stroke-zinc-800'
              }`}
              strokeWidth="0.8"
            />
          </>
        )}
      </svg>
    </div>
  );
};
