const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function patchPGlitePrismaAdapterBytes() {
  const targets = [
    path.join(process.cwd(), 'node_modules', 'pglite-prisma-adapter', 'dist', 'index.mjs'),
    path.join(process.cwd(), 'node_modules', 'pglite-prisma-adapter', 'dist', 'index.cjs'),
  ];
  const replacements = [
    {
      needle: 'return parsePgBytes(serializedBytes);',
      replacement: 'return Array.from(parsePgBytes(serializedBytes));',
      label: 'convertBytes',
    },
    {
      needle: 'rows\n\t\t};',
      replacement: 'rows: rows.map((row) => row.map((value) => ArrayBuffer.isView(value) ? Array.from(value) : value))\n\t\t};',
      label: 'queryRaw rows normalizer',
    },
  ];

  for (const file of targets) {
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const { needle, replacement, label } of replacements) {
      if (!src.includes(needle) || src.includes(replacement)) continue;
      src = src.replace(needle, replacement);
      changed = true;
      console.log(`[postinstall] patched pglite-prisma-adapter ${label}: ${path.relative(process.cwd(), file)}`);
    }
    if (changed) {
      fs.writeFileSync(file, src, 'utf8');
    }
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
