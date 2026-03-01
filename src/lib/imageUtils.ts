/**
 * Convert any image file to a web-compatible format (JPEG).
 * Handles HEIC, TIFF, BMP, and other formats that browsers
 * can decode but can't display as <img> src from URLs.
 */
export function convertToWebFormat(file: File): Promise<File> {
  const webTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  if (webTypes.includes(file.type)) return Promise.resolve(file);

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newName = file.name.replace(/\.[^.]+$/, '.jpg');
            resolve(new File([blob], newName, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.9
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
