import { defaultConfig, type Config } from './config';
import { copyConfig, readSettings, sameSettings, SettingError, settingFields, settingValue, type SettingPath } from './settings';
import { saveSettings, type LoadedSettings } from './settings-storage';

/** Owns the editable draft and persistence feedback; the caller owns the running world. */
export function createSettingsPanel(loaded: LoadedSettings, active: () => Config, apply: (config: Config) => void, signal: AbortSignal) {
  const form = document.querySelector<HTMLFormElement>('#settings-form')!;
  const fields = document.querySelector<HTMLElement>('#settings-fields')!;
  const message = document.querySelector<HTMLElement>('#settings-message')!;
  const state = document.querySelector<HTMLElement>('#settings-state')!;
  const notice = document.querySelector<HTMLElement>('#settings-notice')!;
  const inputs = new Map<SettingPath, HTMLInputElement>();
  let saved = loaded.saved;
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
    for (const [path, input] of inputs) input.value = String(settingValue(config, path));
    refresh();
  };
  const clearError = () => {
    message.textContent = ''; message.removeAttribute('data-error');
    for (const input of inputs.values()) input.removeAttribute('aria-invalid');
  };
  const perform = (action: (config: Config) => void) => {
    clearError();
    try { action(read()); }
    catch (error) {
      message.textContent = error instanceof Error ? error.message : String(error);
      message.dataset.error = 'true';
      if (error instanceof SettingError && error.path) {
        const input = inputs.get(error.path)!; input.setAttribute('aria-invalid', 'true'); input.focus();
      } else message.focus();
    }
    refresh();
  };
  form.addEventListener('input', () => { clearError(); refresh(); }, { signal });
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
  fill(loaded.config);
  return {
    refresh,
    setTempo(value: number) { inputs.get('speedMultiplier')!.value = String(value); clearError(); refresh(); },
  };
}
