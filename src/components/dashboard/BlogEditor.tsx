import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { api, ApiClientError } from '../../lib/api-client';

interface CategoryOption {
  _id: string;
  name: string;
}

interface InitialBlog {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  coverImage: { url: string; publicId: string } | null;
  categories: string[];
  tags: string[];
  slug: string;
}

const inputClass =
  'w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none';

export default function BlogEditor({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial?: InitialBlog;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initial?.categories ?? []);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [cover, setCover] = useState(initial?.coverImage ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const isEdit = Boolean(initial);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function onCoverSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCoverUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.upload<{ image: { url: string; publicId: string } }>('/api/upload/image', formData);
      setCover(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover upload failed');
    } finally {
      setCoverUploading(false);
    }
  }

  async function save(status: 'draft' | 'published') {
    if (!title.trim()) {
      setError('Give your blog a title first.');
      return;
    }
    if (status === 'published' && !content.trim()) {
      setError('Write some content before publishing.');
      return;
    }

    setSaving(status);
    setError(null);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10);

    const payload = {
      title,
      excerpt,
      content,
      categories: selectedCategories,
      tags,
      status,
      ...(cover ? { coverImage: cover } : {}),
    };

    try {
      if (isEdit && initial) {
        await api.put(`/api/blogs/${initial._id}`, payload);
        window.location.href = `/dashboard/blogs`;
      } else {
        const data = await api.post<{ blog: { _id: string } }>('/api/blogs', payload);
        // Cover image, if selected, is attached via a follow-up update since creation doesn't accept it directly.
        if (cover) await api.put(`/api/blogs/${data.blog._id}`, { coverImage: cover } as any);
        window.location.href = `/dashboard/blogs`;
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save blog');
    } finally {
      setSaving(null);
    }
  }

  async function remove() {
    if (!initial) return;
    if (!window.confirm('Delete this blog? This cannot be undone.')) return;
    await api.delete(`/api/blogs/${initial._id}`);
    window.location.href = '/dashboard/blogs';
  }

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center justify-between">
        <button onClick={() => setPreview((v) => !v)} className="text-sm text-[var(--color-accent)] hover:underline">
          {preview ? 'Back to editing' : 'Preview'}
        </button>
        {isEdit && (
          <button onClick={remove} className="text-sm text-red-600 hover:underline">
            Delete blog
          </button>
        )}
      </div>

      {preview ? (
        <article className="rounded-lg border border-[var(--color-line)] bg-white p-8">
          {cover && <img src={cover.url} alt="" className="mb-6 w-full rounded-md object-cover" style={{ aspectRatio: '16/9' }} />}
          <h1 className="font-serif text-3xl font-semibold text-[var(--color-ink)]">{title || 'Untitled'}</h1>
          {excerpt && <p className="mt-3 text-lg text-[var(--color-ink-soft)]">{excerpt}</p>}
          <div className="prose-article mt-6" dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      ) : (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Blog title"
            className="w-full border-none bg-transparent font-serif text-3xl font-semibold text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)]/50 focus:outline-none"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Cover image</label>
            {cover ? (
              <div className="relative">
                <img src={cover.url} alt="" className="w-full rounded-md object-cover" style={{ aspectRatio: '16/9' }} />
                <button onClick={() => setCover(null)} className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]">
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--color-line)] text-sm text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]">
                {coverUploading ? 'Uploading…' : 'Click to upload a cover image'}
                <input type="file" accept="image/*" hidden onChange={onCoverSelected} />
              </label>
            )}
          </div>

          <div>
            <label htmlFor="excerpt" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Excerpt</label>
            <textarea id="excerpt" rows={2} maxLength={400} className={inputClass} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A short summary shown in feeds and search results" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Content</label>
            <RichTextEditor value={content} onChange={setContent} uploadFolder="blog-content" />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleCategory(c._id)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      selectedCategories.includes(c._id)
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                        : 'border-[var(--color-line)] text-[var(--color-ink-soft)]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="tags" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Tags</label>
            <input id="tags" className={inputClass} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="comma, separated, tags" />
          </div>

          <div className="flex gap-3 border-t border-[var(--color-line)] pt-6">
            <button
              onClick={() => save('draft')}
              disabled={saving !== null}
              className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)] disabled:opacity-60"
            >
              {saving === 'draft' ? 'Saving…' : 'Save draft'}
            </button>
            <button
              onClick={() => save('published')}
              disabled={saving !== null}
              className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-accent)] disabled:opacity-60"
            >
              {saving === 'published' ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
