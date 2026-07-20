import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Magiora',
    short_name: 'Magiora',
    description: 'Where ideas become productions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f3ee',
    theme_color: '#712b13',
  };
}
