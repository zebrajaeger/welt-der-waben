/** Language-independent errors shared by configuration, files and storage. */
export type ErrorCode = 'storage' | 'fileRead' | 'json' | 'record' | 'version' | 'species' | 'missing'
  | 'type' | 'finite' | 'minimum' | 'positive' | 'integer' | 'initialEnergy' | 'fraction'
  | 'population' | 'growth' | 'canvas';
export class ApplicationError extends Error {
  constructor(readonly code: ErrorCode, readonly parameters: Record<string, number | string> = {}, readonly path?: string) {
    super(`${code}${path ? `: ${path}` : ''}`);
    this.name = 'ApplicationError';
  }
}
