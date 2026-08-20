import type { APIRoute } from 'astro';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../../lib/db';
import { Blog } from '../../../models/Blog';
import { Comment } from '../../../models/Comment';
import { Like } from '../../../models/Like';
import { Tag } from '../../../models/Tag';
import { updateBlogSchema } from '../../../lib/validation/blog';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { deleteImage } from '../../../lib/cloudinary';
import { isBlockedEitherWay } from '../../../lib/social';

export const prerender = false;

async function findBlogByIdOrSlug(idOrSlug: string) {
  const isObjectId = mongoose.isValidObjectId(idOrSlug);
  return Blog.findOne(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }).populate(
    'author',
    'username name avatarUrl bio',
  );
}

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!params.id) return jsonError('Missing id', 400);
    await connectToDatabase();

    const blog = await findBlogByIdOrSlug(params.id);
    if (!blog) return jsonError('Blog not found', 404);

    const authorId = String((blog.author as any)._id ?? blog.author);
    const isOwner = locals.user && String(locals.user._id) === authorId;
    const isAdmin = locals.user?.role === 'admin';

    if (blog.status !== 'published' && !isOwner && !isAdmin) {
      return jsonError('Blog not found', 404);
    }

    if (locals.user && (await isBlockedEitherWay(String(locals.user._id), authorId))) {
      return jsonError('Blog not found', 404);
    }

    let liked = false;
    if (locals.user) {
      liked = Boolean(await Like.exists({ blog: blog._id, user: locals.user._id }));
    }

    if (blog.status === 'published' && !isOwner) {
      Blog.updateOne({ _id: blog._id }, { $inc: { viewsCount: 1 } }).exec();
    }

    return jsonOk({ blog, liked, isOwner });
  } catch (err) {
    return handleApiError(err);
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const blog = await Blog.findById(params.id);
    if (!blog) return jsonError('Blog not found', 404);

    const isOwner = String(blog.author) === String(locals.user._id);
    if (!isOwner && locals.user.role !== 'admin') {
      return jsonError('You do not have permission to edit this blog', 403);
    }

    const body = await request.json().catch(() => null);
    const parsed = updateBlogSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);

    const { title, excerpt, content, categories, tags, status, coverImage } = parsed.data;

    if (title !== undefined) blog.title = title;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (content !== undefined) blog.content = content;
    if (coverImage !== undefined) {
      const previous = blog.coverImage;
      blog.coverImage = coverImage;
      if (previous && previous.publicId !== coverImage?.publicId) {
        await deleteImage(previous.publicId).catch(() => null);
      }
    }
    if (categories !== undefined) blog.categories = categories as any;
    if (tags !== undefined) {
      const ids: mongoose.Types.ObjectId[] = [];
      for (const name of tags) {
        const slug = name.toLowerCase().trim().replace(/\s+/g, '-').slice(0, 40);
        if (!slug) continue;
        const tag = await Tag.findOneAndUpdate(
          { slug },
          { $setOnInsert: { name, slug } },
          { upsert: true, new: true },
        );
        ids.push(tag._id as mongoose.Types.ObjectId);
      }
      blog.tags = ids as any;
    }
    if (status !== undefined && status !== blog.status) {
      blog.status = status;
      if (status === 'published' && !blog.publishedAt) blog.publishedAt = new Date();
    }

    await blog.save();
    return jsonOk({ blog });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const blog = await Blog.findById(params.id);
    if (!blog) return jsonError('Blog not found', 404);

    const isOwner = String(blog.author) === String(locals.user._id);
    if (!isOwner && locals.user.role !== 'admin') {
      return jsonError('You do not have permission to delete this blog', 403);
    }

    const imagesToDelete = [blog.coverImage, ...blog.images].filter(Boolean) as { publicId: string }[];
    await Promise.all(imagesToDelete.map((img) => deleteImage(img.publicId).catch(() => null)));

    await Comment.deleteMany({ blog: blog._id });
    await Like.deleteMany({ blog: blog._id });
    await blog.deleteOne();

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
};
