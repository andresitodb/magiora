import { cache } from 'react';
import { unstable_cache, revalidateTag } from 'next/cache';
import { createAnonClient } from './supabase/anon';

export type BrandConfig = {
  name: string;
  taglineEn: string;
  taglineEs: string;
  volume: string;
  year: string;
  contactEmail: string;
  memberPriceMonthly: string;
  memberPriceAnnual: string;
  reviewSlaHours: string;
};

async function fetchBrand(): Promise<BrandConfig> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from('site_settings').select('key, value');

  if (error || !data) {
    return {
      name: 'Kinora',
      taglineEn: 'A professional community for independent film',
      taglineEs: 'Una comunidad profesional para el cine independiente',
      volume: 'Vol. 01',
      year: '2026',
      contactEmail: 'hello@example.com',
      memberPriceMonthly: '9.99',
      memberPriceAnnual: '79',
      reviewSlaHours: '24',
    };
  }

  const s = Object.fromEntries(data.map(({ key, value }) => [key, value]));

  return {
    name: s.brand_name ?? 'Kinora',
    taglineEn: s.brand_tagline_en ?? '',
    taglineEs: s.brand_tagline_es ?? '',
    volume: s.brand_volume ?? 'Vol. 01',
    year: s.brand_year ?? '2026',
    contactEmail: s.contact_email ?? '',
    memberPriceMonthly: s.member_price_monthly ?? '9.99',
    memberPriceAnnual: s.member_price_annual ?? '79',
    reviewSlaHours: s.review_sla_hours ?? '24',
  };
}

const getCachedBrand = unstable_cache(fetchBrand, ['brand-config'], {
  revalidate: 60,
  tags: ['brand'],
});

export const getBrand = cache(getCachedBrand);

export async function invalidateBrand() {
  revalidateTag('brand', 'max');
}
