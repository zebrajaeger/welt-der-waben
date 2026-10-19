import { defaultConfig, type Config } from './config';
import { copyConfig, readSettings, sameSettings, SettingError, settingFields, settingValue, type SettingPath } from './settings';
import { saveSettings, type LoadedSettings } from './settings-storage';
import { parseSettings, serializeSettings } from './settings-format';

/** Owns the editable draft and persistence feedback; the caller owns the running world. */
export function createSettingsPanel(loaded: LoadedSettings, active: () => Config, apply: (config: Config) => void, signal: AbortSignal) {
  const form = document.querySelector<HTMLFormElement>('#settings-form')!;
  const fields = document.querySelector<HTMLElement>('#settings-fields')!;
  const message = document.querySelector<HTMLElement>('#settings-message')!;
  const state = document.querySelector<HTMLElement>('#settings-state')!;
  const notice = document.querySelector<HTMLElement>('#settings-notice')!;
  const fileInput = document.querySelector<HTMLInputElement>('#settings-file')!;
  const inputs = new Map<SettingPath, HTMLInputElement>();
  let saved = loaded.saved;
  // Any newer form action invalidates a pending asynchronous file read.
  let revision = 0;
  notice.textContent = loaded.notice;
  fields.replaceChildren();
  for (const group of new Set(settingFields.map(field => field.group))) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend'); legend.textContent = group;
    fieldset.append(legend);
    for (const field of settingFields.filter(field => field.group === group)) {
      const label = document.createElement('label');
      label.textContent = field.label;
      const input = document.createElement('input');
      input.type = 'number'; input.id = `setting-${field.path}`; input.name = field.path;
      input.required = true; input.min = String(field.min); input.step = field.integer ? '1' : 'any';
      if (field.max !== undefined) input.max = String(field.max);
      input.setAttribute('aria-describedby', 'settings-help settings-message');
      label.htmlFor = input.id; label.append(input); fieldset.append(label);
      inputs.set(field.path, input);
    }
    fields.append(fieldset);
  }
  const read = () => readSettings(path => inputs.get(path)!.value);
  const refresh = () => {
    try {
      const draft = read();
      state.textContent = `${sameSettings(draft, active()) ? 'Werte sind aktiv.' : 'Änderungen noch nicht übernommen.'} ${saved ? sameSettings(draft, saved) ? 'Entwurf ist im Browser gespeichert.' : 'Entwurf weicht von gespeicherten Werten ab.' : 'Entwurf ist noch nicht im Browser gespeichert.'}`;
    } catch { state.textContent = 'Entwurf ist ungültig und kann noch nicht übernommen oder gespeichert werden.'; }
  };
  const fill = (config: Config) => {
    revision++;
    for (const [path, input] of inputs) input.value = String(settingValue(config, path));
    refresh();
  };
  const clearError = () => {
    message.textContent = ''; message.removeAttribute('data-error');
    for (const input of inputs.values()) input.removeAttribute('aria-invalid');
  };
  const showError = (error: unknown) => {
    message.textContent = error instanceof Error ? error.message : String(error);
    message.dataset.error = 'true';
    if (error instanceof SettingError && error.path) {
      const input = inputs.get(error.path)!; input.setAttribute('aria-invalid', 'true'); input.focus();
    } else message.focus();
  };
  const perform = (action: (config: Config) => void) => {
    revision++;
    clearError();
    try { action(read()); }
    catch (error) { showError(error); }
    refresh();
  };
  form.addEventListener('input', event => {
    if (event.target === fileInput) return;
    revision++; clearError(); refresh();
  }, { signal });
  form.addEventListener('submit', event => {
    event.preventDefault();
    perform(config => { apply(config); message.textContent = 'Einstellungen übernommen. Neuer Lauf gestartet.'; });
  }, { signal });
  document.querySelector('#settings-save')!.addEventListener('click', () => perform(config => {
    saveSettings(config); saved = copyConfig(config);
    notice.textContent = ''; message.textContent = 'Einstellungen im Browser gespeichert.';
  }), { signal });
  document.querySelector('#settings-defaults')!.addEventListener('click', () => {
    clearError(); fill(defaultConfig);
    message.textContent = 'Standardwerte im Formular. Zum Starten übernehmen; für spätere Besuche im Browser speichern.';
  }, { signal });
  document.querySelector('#settings-export')!.addEventListener('click', () => perform(config => {
    const url = URL.createObjectURL(new Blob([serializeSettings(config)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'welt-der-waben-settings.json';
    document.body.append(link);
    try {
      link.click();
      message.textContent = 'JSON-Download gestartet. Exportiert wurde der Formularentwurf.';
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }), { signal });
  document.querySelector('#settings-import')!.addEventListener('click', () => {
    revision++; clearError();
    fileInput.click();
  }, { signal });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    const request = ++revision;
    if (!file) return;
    clearError();
    message.textContent = 'JSON-Datei wird gelesen …';
    const current = () => !signal.aborted && request === revision;
    try {
      let text: string;
      try { text = await file.text(); }
      catch { throw new Error('Die JSON-Datei konnte nicht gelesen werden. Bitte erneut auswählen.'); }
      if (!current()) return;
      const config = parseSettings(text);
      fill(config);
      message.textContent = 'JSON-Einstellungen ins Formular geladen. Zum Starten übernehmen; für spätere Besuche im Browser speichern.';
    } catch (error) {
      if (!current()) return;
      showError(error);
    }
    refresh();
  }, { signal });
  fill(loaded.config);
  return {
    refresh,
    setTempo(value: number) { revision++; inputs.get('speedMultiplier')!.value = String(value); clearError(); refresh(); },
  };
}
