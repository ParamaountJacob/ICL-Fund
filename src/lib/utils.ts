export function sanitizeFileName(fileName: string): string {
  // Get the file extension
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot > -1 ? fileName.slice(lastDot) : '';
  const nameWithoutExt = lastDot > -1 ? fileName.slice(0, lastDot) : fileName;
  
  // Replace invalid characters and spaces with underscores
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple consecutive underscores with a single one
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
  return sanitizedName + ext;
}