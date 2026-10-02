export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    // If it is a Cloudinary URL, ensure optimal delivery with f_auto,q_auto
    if (path.includes('res.cloudinary.com') && path.includes('/upload/')) {
      if (!path.includes('/f_auto') && !path.includes('/q_auto')) {
        return path.replace('/upload/', '/upload/f_auto,q_auto/');
      }
    }
    return path;
  }
  const serverUrl = import.meta.env.VITE_SERVER_URL || '';
  return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

