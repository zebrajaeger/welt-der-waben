import { defineConfig } from 'vite';
import english from './src/locales/en.json';

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export default defineConfig({
  base: '/welt-der-waben/',
  plugins: [{
    name: 'english-html',
    transformIndexHtml(html) {
      return html.replace(/__I18N:([\w.]+)__/g, (_, key: string) => {
        const text = english[key as keyof typeof english];
        if (!text) throw new Error(`Missing English HTML translation: ${key}`);
        return escapeHtml(text);
      });
    },
  }],
});
