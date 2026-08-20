import { z } from 'zod';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  width: z.number().optional().default(0),
  height: z.number().optional().default(0),
});

export const createBlogSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  excerpt: z.string().trim().max(400).optional().default(''),
  content: z.string().trim().min(1, 'Content is required').max(100_000),
  categories: z.array(objectId).max(5).optional().default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional().default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  coverImage: imageSchema.nullable().optional(),
});

export const updateBlogSchema = createBlogSchema.partial();

export const listBlogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  status: z.enum(['draft', 'published', 'all']).optional(),
  author: objectId.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  q: z.string().trim().max(200).optional(),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
  parent: objectId.nullable().optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(['user', 'blog', 'comment']),
  targetId: objectId,
  reason: z.string().trim().min(1).max(100),
  details: z.string().trim().max(1000).optional().default(''),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).optional().default(''),
  icon: z.string().trim().max(200).optional().default(''),
  order: z.coerce.number().int().optional().default(0),
});

export const tagSchema = z.object({
  name: z.string().trim().min(1).max(40),
});

export { objectId };
