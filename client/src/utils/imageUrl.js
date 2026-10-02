export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const serverUrl = import.meta.env.VITE_SERVER_URL || '';
  return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
