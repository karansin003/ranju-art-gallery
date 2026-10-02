export function getImageUrl(path, options = {}) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    // If it is a Cloudinary URL, ensure optimal delivery with f_auto,q_auto and optional thumbnail sizing
    if (path.includes('res.cloudinary.com') && path.includes('/upload/')) {
      const parts = ['f_auto', 'q_auto'];
      if (options.width) {
        parts.push(`w_${options.width}`);
        parts.push(options.crop || 'c_limit');
      }
      const transformStr = parts.join(',');

      const uploadIdx = path.indexOf('/upload/');
      const afterUpload = path.slice(uploadIdx + 8);
      const slashIdx = afterUpload.indexOf('/');
      if (slashIdx !== -1) {
        const firstSegment = afterUpload.slice(0, slashIdx);
        if (/^v\d+$/.test(firstSegment)) {
          return `${path.slice(0, uploadIdx + 8)}${transformStr}/${afterUpload}`;
        } else {
          return `${path.slice(0, uploadIdx + 8)}${transformStr}/${afterUpload.slice(slashIdx + 1)}`;
        }
      }
      return `${path.slice(0, uploadIdx + 8)}${transformStr}/${afterUpload}`;
    }
    return path;
  }
  const serverUrl = import.meta.env.VITE_SERVER_URL || '';
  return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getThumbnailUrl(path, width = 600) {
  return getImageUrl(path, { width, crop: 'c_limit' });
}


