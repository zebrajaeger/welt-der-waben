import { defaultConfig, type Config } from './config';
import { copyConfig, readSettings, sameSettings, SettingError, settingFields, settingValue, type SettingPath } from './settings';
import { saveSettings, type LoadedSettings } from './settings-storage';
import { parseSettings, serializeSettings } from './settings-format';
import type { Localization } from './i18n';
import { ApplicationError } from './errors';
import { errorMessage } from './error-message';

/** Owns the editable draft and persistence feedback; the caller owns the running world. */
export function createSettingsPanel(loaded: LoadedSettings, active: () => Config, apply: (config: Config) => void, signal: AbortSignal, i18n: Localization) {
  const form = document.querySelector<HTMLFormElement>('#settings-form')!;
  const fields = document.querySelector<HTMLElement>('#settings-fields')!;
  const message = document.querySelector<HTMLElement>('#settings-message')!;
  const state = document.querySelector<HTMLElement>('#settings-state')!;
  const notice = document.querySelector<HTMLElement>('#settings-notice')!;
  const fileInput = document.querySelector<HTMLInputElement>('#settings-file')!;
  const inputs = new Map<SettingPath, HTMLInputElement>();
  let saved = loaded.saved;
  let noticeKey = loaded.notice;
  let renderMessage = () => '';
  const setMessage = (key: string) => { renderMessage = () => i18n.t(key); message.textContent = renderMessage(); };
  // Any newer form action invalidates a pending asynchronous file read.
  let revision = 0;
  notice.textContent = loaded.notice ? i18n.t(loaded.notice) : '';
  fields.replaceChildren();
  for (const group of new Set(settingFields.map(field => field.group))) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend'); legend.dataset.i18n = group; legend.textContent = i18n.t(group);
    fieldset.append(legend);
    for (const field of settingFields.filter(field => field.group === group)) {
      const label = document.createElement('label');
      const text = document.createElement('span'); text.dataset.i18n = field.label; text.textContent = i18n.t(field.label);
      label.append(text);
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
      state.textContent = i18n.t('settings.state', { active: i18n.t(sameSettings(draft, active()) ? 'settings.active' : 'settings.pending'),
        saved: i18n.t(saved ? sameSettings(draft, saved) ? 'settings.savedDraft' : 'settings.differentDraft' : 'settings.unsavedDraft') });
    } catch { state.textContent = i18n.t('settings.invalidDraft'); }
  };
  const fill = (config: Config) => {
    revision++;
    for (const [path, input] of inputs) input.value = String(settingValue(config, path));
    refresh();
  };
  const clearError = () => {
    renderMessage = () => '';
    message.textContent = ''; message.removeAttribute('data-error');
    for (const input of inputs.values()) input.removeAttribute('aria-invalid');
  };
  const showError = (error: unknown) => {
    renderMessage = () => errorMessage(error, i18n);
    message.textContent = renderMessage();
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
    perform(config => { apply(config); setMessage('settings.applied'); });
  }, { signal });
  document.querySelector('#settings-save')!.addEventListener('click', () => perform(config => {
    saveSettings(config); saved = copyConfig(config);
    noticeKey = ''; notice.textContent = ''; setMessage('settings.saved');
  }), { signal });
  document.querySelector('#settings-defaults')!.addEventListener('click', () => {
    clearError(); fill(defaultConfig);
    setMessage('settings.defaultsLoaded');
  }, { signal });
  document.querySelector('#settings-export')!.addEventListener('click', () => perform(config => {
    const url = URL.createObjectURL(new Blob([serializeSettings(config)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'welt-der-waben-settings.json';
    document.body.append(link);
    try {
      link.click();
      setMessage('settings.exported');
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
    setMessage('settings.reading');
    const current = () => !signal.aborted && request === revision;
    try {
      let text: string;
      try { text = await file.text(); }
      catch { throw new ApplicationError('fileRead'); }
      if (!current()) return;
      const config = parseSettings(text);
      fill(config);
      setMessage('settings.imported');
    } catch (error) {
      if (!current()) return;
      showError(error);
    }
    refresh();
  }, { signal });
  fill(loaded.config);
  return {
    refresh,
    localize() {
      notice.textContent = noticeKey ? i18n.t(noticeKey) : '';
      message.textContent = renderMessage();
      refresh();
    },
    setTempo(value: number) { revision++; inputs.get('speedMultiplier')!.value = String(value); clearError(); refresh(); },
  };
}
