import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveLocale } from '../src/lib/locale.ts';
import { buildIcsEvent } from '../src/lib/ics.ts';
import { applyPublicBrand } from '../src/lib/publicBrand.ts';

test('Magiora locale cookie takes priority over the legacy fallback', () => {
  assert.equal(resolveLocale('en', 'es'), 'en');
  assert.equal(resolveLocale('es', 'en'), 'es');
  assert.equal(resolveLocale(undefined, 'es'), 'es');
  assert.equal(resolveLocale(undefined, 'en'), 'en');
  assert.equal(resolveLocale(undefined, undefined), 'en');
});

test('ICS event UID remains in the historical namespace and is content-stable', () => {
  const event = {
    id: 'event-123',
    title: 'Original title',
    description: null,
    event_date: '2026-08-01T18:00:00.000Z',
    end_date: null,
    location_name: null,
    location_address: null,
    online_link: null,
  };

  const originalUid = buildIcsEvent(event, 'https://magiora.com').find((line) =>
    line.startsWith('UID:')
  );
  const updatedUid = buildIcsEvent(
    { ...event, title: 'Updated title', event_date: '2026-08-02T18:00:00.000Z' },
    'https://magiora.com'
  ).find((line) => line.startsWith('UID:'));

  assert.equal(originalUid, 'UID:event-event-123@kinora.com');
  assert.equal(updatedUid, originalUid);
});

test('legacy system copy is normalized without changing user-authored content', () => {
  const legacyCopy = 'Welcome to Kinora. Contact hello@kinora.com.';

  assert.equal(
    applyPublicBrand(legacyCopy, 'system'),
    'Welcome to Magiora. Contact hello@magiora.com.'
  );
  assert.equal(applyPublicBrand(legacyCopy, 'user'), legacyCopy);
  assert.equal(applyPublicBrand(legacyCopy), legacyCopy);
});
