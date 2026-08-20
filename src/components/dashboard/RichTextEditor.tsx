import { useEffect, useRef } from 'react';
import { api } from '../../lib/api-client';

const BUTTONS: { cmd: string; label: string; arg?: string }[] = [
  { cmd: 'bold', label: 'B' },
  { cmd: 'italic', label: 'I' },
  { cmd: 'formatBlock', label: 'H2', arg: '<h2>' },
  { cmd: 'formatBlock', label: 'H3', arg: '<h3>' },
  { cmd: 'formatBlock', label: '“', arg: '<blockquote>' },
  { cmd: 'insertUnorderedList', label: '• List' },
  { cmd: 'insertOrderedList', label: '1. List' },
];

export default function RichTextEditor({
  value,
  onChange,
  uploadFolder,
}: {
  value: string;
  onChange: (html: string) => void;
  uploadFolder: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uncontrolled by design: only sync external `value` changes (e.g. async load in
  // edit mode) into the DOM, never on every keystroke — otherwise the caret jumps.
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML ?? '');
  }

  function insertLink() {
    const url = window.prompt('Link URL');
    if (url) exec('createLink', url);
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await api.upload<{ image: { url: string } }>('/api/upload/image', formData);
      exec('insertImage', data.image.url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors focus-within:border-[var(--color-accent)]">
      <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2">
        {BUTTONS.map((b) => (
          <button
            key={b.label}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(b.cmd, b.arg)}
            className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
          >
            {b.label}
          </button>
        ))}
        <span className="mx-1 my-1 w-px bg-[var(--color-border)]" aria-hidden="true" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertLink} className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]">
          Link
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]">
          Image
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFileSelected} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        className="prose-article editor-content min-h-[320px] max-w-none p-4 text-base text-[var(--color-ink-strong)] focus:outline-none"
        data-placeholder="Start writing…"
        aria-label="Blog content"
      />
    </div>
  );
}
