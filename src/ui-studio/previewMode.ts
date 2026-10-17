/** A preview is a separate, volatile application: campaign writes are forbidden. */
export function isUiStudioPreview(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location?.search ?? '').get('uiStudioPreview') === '1'
}

export const uiPreviewCampaignStorage = {
  getItem: (_name: string): string | null => null,
  setItem: (_name: string, _value: string): void => {},
  removeItem: (_name: string): void => {},
}
