import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function processDir(dir) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
        const stat = statSync(full);
        if (stat.isDirectory()) {
            processDir(full);
        } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
            let content = readFileSync(full, 'utf-8');
            // Remove dark: class variants (e.g. dark:bg-slate-900, dark:hover:bg-slate-800/30)
            const newContent = content.replace(/ dark:[a-zA-Z0-9_/\-\[\]:\.!]+/g, '');
            if (content !== newContent) {
                writeFileSync(full, newContent, 'utf-8');
                console.log('Cleaned:', full);
            }
        }
    }
}

processDir(join(process.cwd(), 'src'));
