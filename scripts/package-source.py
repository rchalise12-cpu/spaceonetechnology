"""Create a source-only release archive. Never include credentials, local data, or build caches."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
target = root / 'artifacts' / 'space-one-client-portal.zip'
target.parent.mkdir(exist_ok=True)
folders = ['src', 'static', 'migrations', 'scripts', 'tests', 'docs']
files = ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'README.md',
         'svelte.config.js', 'vite.config.ts', 'tsconfig.json', 'wrangler.jsonc',
         'drizzle.config.ts', 'worker-configuration.d.ts', '.gitignore',
         '.prettierrc.json', '.prettierignore', '.dev.vars.example', '.nvmrc']
selected = [root / name for name in files]
for folder in folders:
    selected.extend(p for p in (root / folder).rglob('*') if p.is_file()
                    and p.suffix != '.code-workspace' and p.name != '.DS_Store'
                    and '__pycache__' not in p.parts)
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(set(selected)):
        if path.exists():
            archive.write(path, 'space-one/' + str(path.relative_to(root)))
with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert not any('/node_modules/' in n or '/.wrangler/' in n or n.endswith('/.dev.vars')
                   or '/.git/' in n for n in archive.namelist())
print(f'{target}: {len(selected)} source files, {target.stat().st_size:,} bytes')
