import { catalogs, type Localization } from './i18n';
import { saveLanguage } from './language-storage';

const flags = import.meta.glob<string>('./flags/*.svg', { eager: true, import: 'default', query: '?url' });

/** Names come from each language's own catalog, independent of the current locale. */
export function createLanguageControl(i18n: Localization, change: () => void, signal: AbortSignal) {
  const host = document.querySelector<HTMLElement>('#language-control')!;
  const toggle = document.querySelector<HTMLButtonElement>('#language-toggle')!;
  const choices = document.querySelector<HTMLElement>('#language-choices')!;
  const current = document.querySelector<HTMLElement>('#language-current')!;
  const buttons = new Map<string, HTMLButtonElement>();
  const badge = (locale: string) => {
    const url = flags[`./flags/${catalogs[locale]['language.flag']}.svg`];
    if (url) {
      const image = document.createElement('img'); image.src = url; image.alt = ''; image.width = 24; image.height = 16;
      return image;
    }
    const globe = document.createElement('span'); globe.textContent = '🌐'; globe.setAttribute('aria-hidden', 'true'); return globe;
  };
  const close = (focus = false) => {
    choices.hidden = true; toggle.setAttribute('aria-expanded', 'false');
    if (focus) toggle.focus();
  };
  const refresh = () => {
    current.replaceChildren(badge(i18n.locale));
    for (const [locale, button] of buttons) button.setAttribute('aria-pressed', String(locale === i18n.locale));
  };
  choices.replaceChildren();
  for (const [locale, catalog] of Object.entries(catalogs)) {
    const button = document.createElement('button'); button.type = 'button'; button.lang = locale;
    button.dataset.language = locale;
    const name = catalog['language.nativeName'] || new Intl.DisplayNames([locale], { type: 'language' }).of(locale) || locale;
    const check = document.createElement('span'); check.className = 'language-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true');
    button.append(badge(locale), name, check);
    button.addEventListener('click', () => {
      i18n.setLanguage(locale); saveLanguage(locale); change(); refresh(); close(true);
    }, { signal });
    choices.append(button); buttons.set(locale, button);
  }
  toggle.addEventListener('click', () => {
    if (!choices.hidden) { close(); return; }
    choices.hidden = false; toggle.setAttribute('aria-expanded', 'true'); buttons.get(i18n.locale)?.focus();
  }, { signal });
  host.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(true); event.stopPropagation(); }
    if (choices.hidden || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = [...buttons.values()], index = items.indexOf(document.activeElement as HTMLButtonElement);
    items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
  }, { signal });
  document.addEventListener('pointerdown', event => { if (!host.contains(event.target as Node)) close(); }, { signal });
  host.addEventListener('focusout', event => { if (!host.contains(event.relatedTarget as Node | null)) close(); }, { signal });
  refresh();
}
