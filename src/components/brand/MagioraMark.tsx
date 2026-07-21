import type { SVGProps } from 'react';

type MagioraMarkProps = SVGProps<SVGSVGElement> & {
  decorative?: boolean;
  title?: string;
};

export default function MagioraMark({
  decorative = false,
  title = 'Magiora Bridge mark',
  ...props
}: MagioraMarkProps) {
  return (
    <svg
      viewBox="0 0 64 48"
      fill="none"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      {...props}
    >
      {!decorative && <title>{title}</title>}
      <path
        d="M10 40V8L32 28L54 8V40"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
