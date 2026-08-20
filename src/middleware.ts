import { defineMiddleware } from 'astro:middleware';
import { getCurrentUser } from './lib/session';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = await getCurrentUser(context.cookies).catch(() => null);

  if (context.url.pathname.startsWith('/admin')) {
    if (!context.locals.user) {
      return context.redirect(`/login?next=${encodeURIComponent(context.url.pathname)}`);
    }
    if (context.locals.user.role !== 'admin') {
      return context.redirect('/403');
    }
  }

  if (context.url.pathname.startsWith('/dashboard') && !context.locals.user) {
    return context.redirect(`/login?next=${encodeURIComponent(context.url.pathname)}`);
  }

  return next();
});
