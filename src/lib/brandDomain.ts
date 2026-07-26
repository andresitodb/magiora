const DEFAULT_BRAND_DOMAIN = 'magiora.com';

export function getBrandDisplayDomain(configuredDomain?: string | null) {
  const candidate = configuredDomain?.trim().toLowerCase().replace(/\.+$/, '');
  if (!candidate) return DEFAULT_BRAND_DOMAIN;

  const withoutProtocol = candidate.replace(/^https?:\/\//, '').split('/')[0];
  if (
    !withoutProtocol ||
    withoutProtocol === 'localhost' ||
    withoutProtocol.endsWith('.localhost') ||
    withoutProtocol.endsWith('.vercel.app') ||
    !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(withoutProtocol)
  ) {
    return DEFAULT_BRAND_DOMAIN;
  }
  return withoutProtocol.replace(/^www\./, '');
}

export function getProfileDomainPreview(
  slug: string,
  configuredDomain?: string | null,
) {
  const label = slug.trim() || 'yourname';
  return `${label}.${getBrandDisplayDomain(configuredDomain)}`;
}

export function getProfileUrlProductClaim({
  slug = 'yourname',
  configuredDomain,
  subdomainsPubliclyAvailable = false,
}: {
  slug?: string;
  configuredDomain?: string | null;
  subdomainsPubliclyAvailable?: boolean;
}) {
  const domain = getBrandDisplayDomain(configuredDomain);
  return subdomainsPubliclyAvailable
    ? `${slug}.${domain}`
    : `${domain}/m/${slug}`;
}
