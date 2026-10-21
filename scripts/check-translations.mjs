import fs from 'node:fs';
import { catalogProblems, copiedMessages } from '../src/catalog-check.ts';
const root = new URL('../src/', import.meta.url);
const files = fs.readdirSync(new URL('locales/', root)).filter(file => file.endsWith('.json'));
const reference = JSON.parse(fs.readFileSync(new URL('locales/en.json', root), 'utf8'));
const flags = fs.readdirSync(new URL('flags/', root)).map(file => file.replace(/\.svg$/, ''));
let errors = 0;
for (const file of files) {
 const catalog = JSON.parse(fs.readFileSync(new URL(`locales/${file}`, root), 'utf8'));
 const problems = catalogProblems(reference, catalog, flags); errors += problems.length;
 const candidates = file === 'en.json' ? [] : copiedMessages(reference, catalog);
 console.log(JSON.stringify({ locale: file.replace('.json',''), problems, reviewIdentical: candidates }));
}
if(errors) process.exitCode = 1;
