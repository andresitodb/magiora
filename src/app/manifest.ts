import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Magiora',
    short_name: 'Magiora',
    description: 'Where ideas become productions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D0D0D',
    theme_color: '#0D0D0D',
    icons: [
      { src: '/magiora-app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/magiora-pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/magiora-pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
