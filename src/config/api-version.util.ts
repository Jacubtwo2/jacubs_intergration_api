const API_VERSION_FALLBACK = 'api/v1';

function stripSurroundingQuotes(value: string): string {
  return value.replace(/^['"]+|['"]+$/g, '');
}

export function resolveApiVersion(rawValue = process.env.API_VERSION): string {
  if (!rawValue || !rawValue.trim()) {
    return API_VERSION_FALLBACK;
  }

  const sanitized = stripSurroundingQuotes(rawValue.trim())
    .replace(/^\/+/u, '')
    .replace(/\/+$/u, '');

  return sanitized.length > 0 ? sanitized : API_VERSION_FALLBACK;
}
