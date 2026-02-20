const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function patchPGlitePrismaAdapterBytes() {
  const targets = [
    path.join(process.cwd(), 'node_modules', 'pglite-prisma-adapter', 'dist', 'index.mjs'),
    path.join(process.cwd(), 'node_modules', 'pglite-prisma-adapter', 'dist', 'index.cjs'),
  ];
  const needle = 'return parsePgBytes(serializedBytes);';
  const replacement = 'return Array.from(parsePgBytes(serializedBytes));';

  for (const file of targets) {
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes(needle) || src.includes(replacement)) continue;
    fs.writeFileSync(file, src.replace(needle, replacement), 'utf8');
    console.log(`[postinstall] patched pglite-prisma-adapter bytes parser: ${path.relative(process.cwd(), file)}`);
  }
}

patchPGlitePrismaAdapterBytes();

if (process.env.SKIP_HAPPY_WIRE_BUILD === '1') {
  console.log('[postinstall] SKIP_HAPPY_WIRE_BUILD=1, skipping @slopus/happy-wire build');
  process.exit(0);
}

execSync('yarn workspace @slopus/happy-wire build', {
  stdio: 'inherit',
});
