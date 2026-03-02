"use client";

import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";

type Tag = { id: string; name: string };
type Note = {
  id: string;
  title: string;
  content: string;
  tags: Tag[];
  created_at: string;
  updated_at: string;
};

function apiBaseUrl(): string {
  // NEXT_PUBLIC_API_BASE_URL must be set in deployment.
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  // 204 has no body
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagNames, setTagNames] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const selected = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  async function refresh() {
    setError("");
    const query = new URLSearchParams();
    if (q.trim()) query.set("q", q.trim());
    if (tagFilter) query.set("tag", tagFilter);
    query.set("limit", "200");
    query.set("offset", "0");

    const data = await apiFetch<{ items: Note[]; total: number }>(`/api/notes?${query.toString()}`);
    setNotes(data.items);

    const tagData = await apiFetch<{ items: Tag[]; total: number }>(`/api/tags?limit=500&offset=0`);
    setTags(tagData.items);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e?.message || String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadIntoEditor(note: Note) {
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTagNames(note.tags.map((t) => t.name).join(", "));
  }

  function clearEditor() {
    setSelectedId(null);
    setTitle("");
    setContent("");
    setTagNames("");
  }

  async function onSave() {
    setBusy(true);
    setError("");
    try {
      const tagsList = tagNames
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (!title.trim() || !content.trim()) {
        throw new Error("Title and content are required.");
      }

      if (selectedId) {
        await apiFetch<Note>(`/api/notes/${selectedId}`, {
          method: "PUT",
          body: JSON.stringify({ title: title.trim(), content: content.trim(), tags: tagsList }),
        });
      } else {
        const created = await apiFetch<Note>(`/api/notes`, {
          method: "POST",
          body: JSON.stringify({ title: title.trim(), content: content.trim(), tags: tagsList }),
        });
        setSelectedId(created.id);
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch<void>(`/api/notes/${selectedId}`, { method: "DELETE" });
      clearEditor();
      await refresh();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onSearch() {
    setBusy(true);
    setError("");
    try {
      await refresh();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="retro-shell">
      <section className="retro-card">
        <header className="retro-header">
          <div className="retro-header-top">
            <div className="retro-title">NOTE_KEEPER v1.0</div>
            <ThemeToggle />
          </div>
          <div className="retro-subtitle">
            Create, edit, delete, and search notes. Filter by tag. Retro vibes included.
          </div>
        </header>

        <div className="retro-grid">
          {/* LEFT: list/search */}
          <div>
            <div className="retro-row retro-row-space">
              <div className="retro-row retro-row-grow">
                <input
                  className="retro-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="search: title or content..."
                  aria-label="Search notes"
                />
                <button className="retro-btn retro-btn-primary" onClick={onSearch} disabled={busy}>
                  SEARCH
                </button>
              </div>
            </div>

            <div className="retro-row retro-row-space retro-mt-10">
              <div className="retro-row retro-row-wrap">
                <span className="retro-pill">tags</span>
                <button
                  className="retro-btn"
                  onClick={() => {
                    setTagFilter("");
                    onSearch();
                  }}
                  disabled={busy}
                  aria-pressed={!tagFilter}
                >
                  ALL
                </button>
                {tags.slice(0, 12).map((t) => (
                  <button
                    key={t.id}
                    className="retro-btn"
                    onClick={() => {
                      setTagFilter(t.name);
                      onSearch();
                    }}
                    disabled={busy}
                    aria-pressed={tagFilter === t.name}
                    title={`Filter by ${t.name}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              <button className="retro-btn" onClick={clearEditor} disabled={busy}>
                NEW
              </button>
            </div>

            <div className="retro-subtitle retro-mt-10">
              {tagFilter ? `filter: ${tagFilter}` : "filter: none"} • results: {notes.length}
            </div>

            <div className="retro-list retro-mt-12">
              {notes.map((n) => (
                <article
                  key={n.id}
                  className="retro-note"
                  onClick={() => loadIntoEditor(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") loadIntoEditor(n);
                  }}
                  aria-label={`Open note ${n.title}`}
                >
                  <div className="retro-note-title">
                    {n.title} {selectedId === n.id ? "▣" : "▢"}
                  </div>
                  <div className="retro-note-meta">
                    updated: {new Date(n.updated_at).toLocaleString()} • tags:{" "}
                    {n.tags.length ? n.tags.map((t) => t.name).join(", ") : "none"}
                  </div>
                </article>
              ))}
              {!notes.length && <div className="retro-subtitle">No notes found. Try a different search.</div>}
            </div>
          </div>

          {/* RIGHT: editor */}
          <div>
            <div className="retro-row retro-row-space">
              <span className="retro-pill">{selected ? `edit: ${selected.id}` : "new note"}</span>
              <div className="retro-row">
                <button className="retro-btn retro-btn-primary" onClick={onSave} disabled={busy}>
                  SAVE
                </button>
                <button className="retro-btn retro-btn-danger" onClick={onDelete} disabled={busy || !selectedId}>
                  DELETE
                </button>
              </div>
            </div>

            <div className="retro-mt-10">
              <label className="retro-subtitle" htmlFor="title">
                title
              </label>
              <input
                id="title"
                className="retro-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon checklist"
              />
            </div>

            <div className="retro-mt-10">
              <label className="retro-subtitle" htmlFor="content">
                content
              </label>
              <textarea
                id="content"
                className="retro-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your note here..."
              />
            </div>

            <div className="retro-mt-10">
              <label className="retro-subtitle" htmlFor="tags">
                tags (comma-separated)
              </label>
              <input
                id="tags"
                className="retro-input"
                value={tagNames}
                onChange={(e) => setTagNames(e.target.value)}
                placeholder="e.g. work, personal, ideas"
              />
            </div>

            {error ? <div className="retro-error">ERROR: {error}</div> : null}

            <div className="retro-subtitle retro-mt-10">
              Backend: {apiBaseUrl() ? apiBaseUrl() : "NEXT_PUBLIC_API_BASE_URL not set"}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
