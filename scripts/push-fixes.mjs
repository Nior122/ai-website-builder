// One-shot helper: stage, commit, and push the generation fixes.
// Run with: node scripts/push-fixes.mjs
import { execSync } from 'node:child_process';

const files = ['lib/ai/generation.ts', 'lib/ai/stock-images.ts'];
const msg = `fix: resolve generation crash + Prisma brand field error

- Pass dbUserId to updateProject (was landing in userId slot -> userId.startsWith crash)
- Persist brand under settings.brand (Project model has no brand column)
- StockImage as type alias so it assigns to Record<string, unknown>[] (Vercel TS error)

Co-Authored-By: Claude <noreply@anthropic.com>`;

const run = (cmd) => execSync(cmd, { stdio: 'inherit', encoding: 'utf8' });

run(`git add ${files.join(' ')}`);
run(`git commit -m ${JSON.stringify(msg)}`);
run('git push origin master');
console.log('\nDone: staged, committed, and pushed.');
