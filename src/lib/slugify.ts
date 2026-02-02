export function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^a-z0-9\-]/g, '') // Remove invalid chars
    .replace(/-+/g, '-') // Collapse dashes
    .replace(/^-+|-+$/g, ''); // Trim dashes
}

export default slugify;
