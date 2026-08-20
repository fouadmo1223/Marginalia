import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Blog } from '../../../../models/Blog';
import { Like } from '../../../../models/Like';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { createNotification } from '../../../../lib/notify';
import { isBlockedEitherWay } from '../../../../lib/social';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const blog = await Blog.findById(params.id);
    if (!blog || blog.status !== 'published') return jsonError('Blog not found', 404);

    if (await isBlockedEitherWay(String(locals.user._id), String(blog.author))) {
      return jsonError('Blog not found', 404);
    }

    try {
      await Like.create({ blog: blog._id, user: locals.user._id });
    } catch (err: any) {
      if (err?.code === 11000) return jsonError('You already liked this blog', 409);
      throw err;
    }

    await Blog.updateOne({ _id: blog._id }, { $inc: { likesCount: 1 } });
    await createNotification({ recipient: blog.author, actor: locals.user._id, type: 'like', blog: blog._id });

    return jsonOk({ liked: true });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const result = await Like.deleteOne({ blog: params.id, user: locals.user._id });
    if (result.deletedCount > 0) {
      await Blog.updateOne({ _id: params.id }, { $inc: { likesCount: -1 } });
    }

    return jsonOk({ liked: false });
  } catch (err) {
    return handleApiError(err);
  }
};
