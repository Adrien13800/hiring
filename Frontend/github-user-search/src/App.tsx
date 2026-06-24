import { useEffect, useState } from "react";
import "./App.css";

type GithubUser = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
};

type GithubUserCard = GithubUser & {
  cardId: string;
};

type SearchStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "rate-limit";

export default function App() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<GithubUserCard[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const trimmedQuery = query.trim();
  const selectedCount = selectedIds.length;
  const allSelected = users.length > 0 && selectedCount === users.length;
  const hasSelection = selectedCount > 0;

  useEffect(() => {
    if (!trimmedQuery) {
      setUsers([]);
      setSelectedIds([]);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setStatus("loading");

      const params = new URLSearchParams({
        q: trimmedQuery,
        per_page: "12",
      });

      try {
        const response = await fetch(
          `https://api.github.com/search/users?${params.toString()}`,
          { signal: controller.signal },
        );

        if (response.status === 403) {
          setUsers([]);
          setSelectedIds([]);
          setStatus("rate-limit");
          return;
        }

        if (!response.ok) {
          throw new Error("Github request failed");
        }

        const data: { items: GithubUser[] } = await response.json();
        const nextUsers = data.items.map((user) => ({
          ...user,
          cardId: String(user.id),
        }));

        setUsers(nextUsers);
        setSelectedIds([]);
        setStatus(nextUsers.length ? "success" : "empty");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setUsers([]);
        setSelectedIds([]);
        setStatus("error");
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery]);

  function toggleSelected(cardId: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(cardId)
        ? currentIds.filter((id) => id !== cardId)
        : [...currentIds, cardId],
    );
  }

  function toggleAllSelected() {
    setSelectedIds(allSelected ? [] : users.map((user) => user.cardId));
  }

  function deleteSelected() {
    setUsers((currentUsers) =>
      currentUsers.filter((user) => !selectedIds.includes(user.cardId)),
    );
    setSelectedIds([]);
  }

  function duplicateSelected() {
    const selectedUsers = users.filter((user) =>
      selectedIds.includes(user.cardId),
    );

    const duplicatedUsers = selectedUsers.map((user) => ({
      ...user,
      cardId: `${user.id}-${crypto.randomUUID()}`,
    }));

    setUsers((currentUsers) => [...currentUsers, ...duplicatedUsers]);
    setSelectedIds([]);
  }

  return (
    <main className="page">
      <section className="search">
        <div className="header">
          <h1>Github user search</h1>

          <button
            type="button"
            className="edit-button"
            onClick={() => setIsEditing((current) => !current)}
          >
            {isEditing ? "Close edit mode" : "Edit mode"}
          </button>
        </div>

        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a Github username"
          aria-label="Search a Github username"
        />

        {isEditing && users.length > 0 && (
          <div className="edit-toolbar">
            <label>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAllSelected}
              />
              Select all
            </label>

            <span>{selectedCount} selected</span>

            <button
              type="button"
              onClick={duplicateSelected}
              disabled={!hasSelection}
            >
              Duplicate
            </button>

            <button
              type="button"
              onClick={deleteSelected}
              disabled={!hasSelection}
            >
              Delete
            </button>
          </div>
        )}

        {status === "loading" && <p className="message">Loading users...</p>}
        {status === "empty" && <p className="message">No users found.</p>}
        {status === "rate-limit" && (
          <p className="message">Github API rate limit reached.</p>
        )}
        {status === "error" && (
          <p className="message">Something went wrong. Please try again.</p>
        )}

        {users.length > 0 && (
          <div className="user-grid">
            {users.map((user) => (
              <article className="user-card" key={user.cardId}>
                {isEditing && (
                  <input
                    type="checkbox"
                    className="user-checkbox"
                    checked={selectedIds.includes(user.cardId)}
                    onChange={() => toggleSelected(user.cardId)}
                    aria-label={`Select ${user.login}`}
                  />
                )}

                <img
                  className="user-avatar"
                  src={user.avatar_url}
                  alt={user.login}
                />

                <div className="user-info">
                  <h2>{user.login}</h2>
                  <span>#{user.id}</span>
                  <a href={user.html_url} target="_blank" rel="noreferrer">
                    View Github profile
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
