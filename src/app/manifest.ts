import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Magiora',
    short_name: 'Magiora',
    description: 'Where ideas become productions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f6f4',
    theme_color: '#6b3f2a',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
