'use client';

import { useState } from 'react';
import { KNOWN_NETWORKS, getSocialHint, getSocialLabel } from '@/lib/socialLinks';

const COMMON_NETWORKS = ['instagram', 'imdb', 'vimeo', 'youtube', 'x', 'linkedin', 'tiktok'];

export default function ContactEditor({
  defaultContactEmail,
  defaultPhone,
  defaultWebsiteUrl,
  defaultSocial,
  defaultRep,
}: {
  defaultContactEmail: string;
  defaultPhone?: string;
  defaultWebsiteUrl: string;
  defaultSocial: Record<string, string>;
  defaultRep: any;
}) {
  const [social, setSocial] = useState<Record<string, string>>(defaultSocial);
  const [rep, setRep] = useState<any>({
    agency: defaultRep.agency ?? '',
    manager: defaultRep.manager ?? '',
    agent: defaultRep.agent ?? '',
    email: defaultRep.email ?? '',
    phone: defaultRep.phone ?? '',
    website: defaultRep.website ?? '',
    ...defaultRep,
  });

  function setSocialField(network: string, value: string) {
    setSocial((prev) => ({ ...prev, [network]: value }));
  }

  function setRepField(field: string, value: string) {
    setRep((prev: any) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6">
      <input type="hidden" name="social_links" value={JSON.stringify(social)} />
      <input type="hidden" name="representation" value={JSON.stringify(rep)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Contact email</label>
          <input
            type="email"
            name="contact_email"
            defaultValue={defaultContactEmail}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            autoCapitalize="none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            defaultValue={defaultPhone ?? ''}
            placeholder="+1 305 555 1212"
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Personal website</label>
        <input
          type="url"
          name="website_url"
          defaultValue={defaultWebsiteUrl}
          placeholder="https://yoursite.com"
          className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
        />
      </div>

      {/* SOCIAL LINKS */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Social links</p>
        {COMMON_NETWORKS.map((network) => (
          <div key={network} className="grid grid-cols-[110px_1fr] gap-3 items-center">
            <label className="text-sm font-serif capitalize text-stone-600">
              {getSocialLabel(network)}
            </label>
            <input
              type="text"
              value={social[network] ?? ''}
              onChange={(e) => setSocialField(network, e.target.value)}
              placeholder={getSocialHint(network)}
              className="px-3 py-1.5 border border-stone-300 rounded text-sm bg-white"
              autoCapitalize="none"
            />
          </div>
        ))}
      </div>

      {/* REPRESENTATION */}
      <div className="pt-6 border-t border-stone-200 space-y-4">
        <div>
          <p className="text-sm font-medium">Representation</p>
          <p className="text-xs italic text-stone-500 font-serif mt-1">
            Optional. Visible on your public profile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Agency</label>
            <input
              type="text"
              value={rep.agency ?? ''}
              onChange={(e) => setRepField('agency', e.target.value)}
              placeholder="Agency name"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Manager</label>
            <input
              type="text"
              value={rep.manager ?? ''}
              onChange={(e) => setRepField('manager', e.target.value)}
              placeholder="Manager name"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Agent</label>
            <input
              type="text"
              value={rep.agent ?? ''}
              onChange={(e) => setRepField('agent', e.target.value)}
              placeholder="Agent name"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
            />
          </div>
        </div>

        <p className="text-xs italic text-stone-500 font-serif">
          Contact info for your representation:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Rep email</label>
            <input
              type="email"
              value={rep.email ?? ''}
              onChange={(e) => setRepField('email', e.target.value)}
              placeholder="rep@agency.com"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
              autoCapitalize="none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Rep phone</label>
            <input
              type="tel"
              value={rep.phone ?? ''}
              onChange={(e) => setRepField('phone', e.target.value)}
              placeholder="+1 555 1212"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Rep website</label>
            <input
              type="url"
              value={rep.website ?? ''}
              onChange={(e) => setRepField('website', e.target.value)}
              placeholder="https://agency.com"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
              autoCapitalize="none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
