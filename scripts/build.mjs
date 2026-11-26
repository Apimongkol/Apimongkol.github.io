import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'src', 'template.html');
const INPUT_CSS_PATH = path.join(ROOT_DIR, 'src', 'styles.css');
const OUTPUT_HTML_PATH = path.join(ROOT_DIR, 'index.html');

const tailwindCli = path.join(ROOT_DIR, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs');

const compiledCss = execFileSync(
  process.execPath,
  [tailwindCli, '-i', INPUT_CSS_PATH, '--minify'],
  { cwd: ROOT_DIR, encoding: 'utf8' }
).trim();

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const marker = '/* TAILWIND_CSS */';
if (!template.includes(marker)) {
  throw new Error(`Missing ${marker} placeholder in src/template.html`);
}

const outputHtml = template.replace(marker, compiledCss);
fs.writeFileSync(OUTPUT_HTML_PATH, outputHtml, 'utf8');
console.log(`Built ${OUTPUT_HTML_PATH} (${(outputHtml.length / 1024).toFixed(1)} KB)`);
