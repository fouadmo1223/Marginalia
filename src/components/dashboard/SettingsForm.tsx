import { useState } from 'react';
import { api, ApiClientError } from '../../lib/api-client';

interface Props {
  initialName: string;
  initialBio: string;
  initialAvatar: string | null;
  username: string;
}

const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink-strong)] focus:border-[var(--color-accent)] focus:outline-none';

export default function SettingsForm({ initialName, initialBio, initialAvatar, username }: Props) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function onAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.upload<{ avatarUrl: string }>('/api/upload/avatar', formData);
      setAvatar(data.avatarUrl);
      // The nav's user menu is server-rendered from Astro.locals.user at page load,
      // so a full reload is needed for the new avatar to show up there too.
      window.location.reload();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
      setAvatarUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/api/users/me', { name, bio });
      setMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiClientError ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {message && (
        <p className={`rounded-md px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </p>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">Avatar</label>
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--color-paper-raised)] text-xl font-medium">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
          </span>
          <label className="cursor-pointer rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">
            {avatarUploading ? 'Uploading…' : 'Change avatar'}
            <input type="file" accept="image/*" hidden onChange={onAvatarSelected} />
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Username</label>
        <input id="username" disabled value={`@${username}`} className={`${inputClass} bg-[var(--color-paper-raised)] text-[var(--color-ink-soft)]`} />
      </div>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Name</label>
        <input id="name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Bio</label>
        <textarea id="bio" rows={3} maxLength={280} className={inputClass} value={bio} onChange={(e) => setBio(e.target.value)} />
        <p className="mt-1 text-right text-xs text-[var(--color-ink-soft)]">{bio.length}/280</p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-accent)] disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
