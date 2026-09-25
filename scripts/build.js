import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const path of ['index.html', 'test.html', 'result.html', 'css', 'assets', 'data', 'js', '.nojekyll']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
