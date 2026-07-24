import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const canonicalPath = path.join(
  root,
  'docs/designs/magiora-brand-v3/svg/web/magiora-symbol.svg',
);

function svgGeometry(svg: string) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  const pathData = svg.match(/<path d="([^"]+)"/)?.[1];
  assert.ok(viewBox, 'SVG must declare a viewBox');
  assert.ok(pathData, 'SVG must contain the approved path');
  return { viewBox, pathData };
}

test('all runtime SVG logos use the approved v3 master geometry', async () => {
  const canonical = svgGeometry(await readFile(canonicalPath, 'utf8'));
  const runtimeAssets = [
    'public/magiora-symbol.svg',
    'public/favicon.svg',
    'public/icon.svg',
    'public/magiora-app-icon.svg',
    'src/app/icon.svg',
  ];

  for (const relativePath of runtimeAssets) {
    const runtime = svgGeometry(await readFile(path.join(root, relativePath), 'utf8'));
    assert.equal(runtime.pathData, canonical.pathData, `${relativePath} path drifted from v3`);
  }

  const geometryModule = await readFile(
    path.join(root, 'src/components/brand/magioraGeometry.ts'),
    'utf8',
  );
  assert.ok(geometryModule.includes(canonical.pathData));
  assert.ok(geometryModule.includes(canonical.viewBox));

  const [publicAppleIcon, appAppleIcon] = await Promise.all([
    readFile(path.join(root, 'public/apple-icon.png')),
    readFile(path.join(root, 'src/app/apple-icon.png')),
  ]);
  assert.deepEqual(appAppleIcon, publicAppleIcon);
});
