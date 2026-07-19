export function safeLocalRedirect(
  value: FormDataEntryValue | string | null | undefined,
  fallback: string
): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;
  return value;
}
