import { useEffect, useState } from 'react';
import { api, ApiClientError } from '../../lib/api-client';

interface Author {
  _id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}
interface CommentItem {
  _id: string;
  content: string;
  author: Author;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  replies: CommentItem[];
}

const textareaClass =
  'w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function CommentRow({
  comment,
  currentUserId,
  onReply,
  onUpdate,
  onDelete,
  depth = 0,
}: {
  comment: CommentItem;
  currentUserId: string | null;
  onReply: (parentId: string, content: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [replyDraft, setReplyDraft] = useState('');
  const isOwner = currentUserId && currentUserId === comment.author._id;

  return (
    <div className={depth > 0 ? 'ml-8 mt-3 border-l border-[var(--color-line)] pl-4' : 'py-4'}>
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-paper-raised)] text-xs font-medium">
          {comment.author.avatarUrl ? (
            <img src={comment.author.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            comment.author.name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 text-sm">
            <a href={`/profile/${comment.author.username}`} className="font-medium text-[var(--color-ink)] hover:underline">
              {comment.author.name}
            </a>
            <span className="text-xs text-[var(--color-ink-soft)]">{timeAgo(comment.createdAt)}</span>
            {comment.editedAt && <span className="text-xs text-[var(--color-ink-soft)]">(edited)</span>}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea className={textareaClass} rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await onUpdate(comment._id, draft);
                    setEditing(false);
                  }}
                  className="rounded-full bg-[var(--color-ink)] px-3 py-1 text-xs font-medium text-[var(--color-paper)]"
                >
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-xs text-[var(--color-ink-soft)]">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink)]">{comment.content}</p>
          )}

          <div className="mt-1.5 flex gap-3 text-xs text-[var(--color-ink-soft)]">
            {depth === 0 && (
              <button onClick={() => setReplying((v) => !v)} className="hover:text-[var(--color-ink)]">Reply</button>
            )}
            {isOwner && !editing && (
              <>
                <button onClick={() => setEditing(true)} className="hover:text-[var(--color-ink)]">Edit</button>
                <button onClick={() => onDelete(comment._id)} className="hover:text-red-600">Delete</button>
              </>
            )}
          </div>

          {replying && (
            <div className="mt-2 space-y-2">
              <textarea
                className={textareaClass}
                rows={2}
                placeholder="Write a reply…"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!replyDraft.trim()) return;
                    await onReply(comment._id, replyDraft);
                    setReplyDraft('');
                    setReplying(false);
                  }}
                  className="rounded-full bg-[var(--color-ink)] px-3 py-1 text-xs font-medium text-[var(--color-paper)]"
                >
                  Reply
                </button>
                <button onClick={() => setReplying(false)} className="text-xs text-[var(--color-ink-soft)]">Cancel</button>
              </div>
            </div>
          )}

          {comment.replies?.map((reply) => (
            <CommentRow
              key={reply._id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommentsSection({
  blogId,
  currentUserId,
  isAuthenticated,
}: {
  blogId: string;
  currentUserId: string | null;
  isAuthenticated: boolean;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(p: number) {
    setLoading(true);
    try {
      const data = await api.get<{ comments: CommentItem[]; pagination: { totalPages: number } }>(
        `/api/blogs/${blogId}/comments?page=${p}`,
      );
      setComments((prev) => (p === 1 ? data.comments : [...prev, ...data.comments]));
      setTotalPages(data.pagination.totalPages);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  async function submitComment() {
    if (!isAuthenticated) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!draft.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const data = await api.post<{ comment: CommentItem }>(`/api/blogs/${blogId}/comments`, { content: draft });
      setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
      setDraft('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  }

  async function reply(parentId: string, content: string) {
    const data = await api.post<{ comment: CommentItem }>(`/api/blogs/${blogId}/comments`, { content, parent: parentId });
    setComments((prev) =>
      prev.map((c) => (c._id === parentId ? { ...c, replies: [...c.replies, data.comment] } : c)),
    );
  }

  async function update(id: string, content: string) {
    await api.put(`/api/comments/${id}`, { content });
    setComments((prev) => updateInTree(prev, id, content));
  }

  async function remove(id: string) {
    await api.delete(`/api/comments/${id}`);
    setComments((prev) => removeFromTree(prev, id));
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-12 border-t border-[var(--color-line)] pt-8">
      <h2 id="comments-heading" className="mb-5 font-serif text-xl font-semibold text-[var(--color-ink)]">
        Comments
      </h2>

      <div className="mb-6">
        <textarea
          className={textareaClass}
          rows={3}
          placeholder={isAuthenticated ? 'Add a comment…' : 'Sign in to comment'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <button
          onClick={submitComment}
          disabled={posting}
          className="mt-2 rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-sm font-medium text-[var(--color-paper)] disabled:opacity-60"
        >
          {posting ? 'Posting…' : 'Comment'}
        </button>
      </div>

      {loading && comments.length === 0 && <p className="text-sm text-[var(--color-ink-soft)]">Loading comments…</p>}
      {!loading && comments.length === 0 && <p className="text-sm text-[var(--color-ink-soft)]">No comments yet. Be the first.</p>}

      <div className="divide-y divide-[var(--color-line)]">
        {comments.map((c) => (
          <CommentRow key={c._id} comment={c} currentUserId={currentUserId} onReply={reply} onUpdate={update} onDelete={remove} />
        ))}
      </div>

      {page < totalPages && (
        <button onClick={() => load(page + 1)} className="mt-4 text-sm text-[var(--color-accent)] hover:underline">
          Load more comments
        </button>
      )}
    </section>
  );
}

function updateInTree(items: CommentItem[], id: string, content: string): CommentItem[] {
  return items.map((c) => {
    if (c._id === id) return { ...c, content, editedAt: new Date().toISOString() };
    return { ...c, replies: updateInTree(c.replies, id, content) };
  });
}

function removeFromTree(items: CommentItem[], id: string): CommentItem[] {
  return items
    .filter((c) => c._id !== id)
    .map((c) => ({ ...c, replies: removeFromTree(c.replies, id) }));
}
