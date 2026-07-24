import type { SVGProps } from 'react';
import { MAGIORA_SYMBOL_PATH, MAGIORA_SYMBOL_VIEWBOX } from './magioraGeometry';

type MagioraMarkProps = SVGProps<SVGSVGElement> & {
  decorative?: boolean;
  title?: string;
};

export default function MagioraMark({
  decorative = false,
  title = 'Magiora MA ligature',
  ...props
}: MagioraMarkProps) {
  return (
    <svg
      viewBox={MAGIORA_SYMBOL_VIEWBOX}
      fill="currentColor"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      {...props}
    >
      {!decorative && <title>{title}</title>}
      <path d={MAGIORA_SYMBOL_PATH} />
    </svg>
  );
}
