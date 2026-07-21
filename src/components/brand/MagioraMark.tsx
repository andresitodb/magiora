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
      viewBox="0 0 48 32"
      fill="none"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      {...props}
    >
      {!decorative && <title>{title}</title>}
      <path
        d="M4 28V4L24 21L44 4V28"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
