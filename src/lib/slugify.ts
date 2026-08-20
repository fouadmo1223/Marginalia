import { nanoid } from 'nanoid';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function uniqueSlug(text: string): string {
  const base = slugify(text) || 'post';
  return `${base}-${nanoid(6).toLowerCase()}`;
}
