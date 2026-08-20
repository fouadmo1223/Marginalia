import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api-client';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api.get<{ categories: Category[] }>('/api/admin/categories');
    setCategories(data.categories);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.post('/api/admin/categories', { name, description });
      setName('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this category?')) return;
    await api.delete(`/api/admin/categories/${id}`);
    setCategories((prev) => prev.filter((c) => c._id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex-[2]">
          <label className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Description</label>
          <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button onClick={create} disabled={creating} className="cursor-pointer rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          Add category
        </button>
      </div>
      {error && <p className="mb-3 text-sm font-medium text-[var(--color-error)]">{error}</p>}

      <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        {categories.map((c, i) => (
          <li
            key={c._id}
            className="stagger-in flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-[var(--color-surface-raised)]"
            style={{ '--stagger-i': i } as CSSProperties}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-strong)]">{c.name}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">/{c.slug} {c.description && `— ${c.description}`}</p>
            </div>
            <button onClick={() => remove(c._id)} className="cursor-pointer text-xs font-medium text-[var(--color-error)] hover:underline">Delete</button>
          </li>
        ))}
        {categories.length === 0 && <li className="px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">No categories yet.</li>}
      </ul>
    </div>
  );
}
