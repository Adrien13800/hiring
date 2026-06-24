import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const githubUsers = [
  {
    id: 1,
    login: "octocat",
    avatar_url: "https://example.com/octocat.png",
    html_url: "https://github.com/octocat",
  },
  {
    id: 2,
    login: "gaearon",
    avatar_url: "https://example.com/gaearon.png",
    html_url: "https://github.com/gaearon",
  },
];

const fetchMock = vi.fn();

describe("App", () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: githubUsers }),
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("searches Github users after the debounce delay", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText(/search a github username/i), "octo");

    expect(fetchMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.github.com/search/users?q=octo&per_page=12",
        expect.any(Object),
      );
    });

    expect(await screen.findByText("octocat")).toBeInTheDocument();
    expect(screen.getByText("gaearon")).toBeInTheDocument();
  });

  it("shows an empty state when Github returns no users", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    });

    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText(/search a github username/i), "none");

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("shows a rate limit message when Github returns 403", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: "API rate limit exceeded" }),
    });

    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText(/search a github username/i), "octo");

    expect(
      await screen.findByText("Github API rate limit reached."),
    ).toBeInTheDocument();
  });

  it("selects all users in edit mode", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText(/search a github username/i), "octo");

    await screen.findByText("octocat");

    await user.click(screen.getByRole("button", { name: /edit mode/i }));
    await user.click(screen.getByLabelText(/select all/i));

    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(screen.getByLabelText(/select octocat/i)).toBeChecked();
    expect(screen.getByLabelText(/select gaearon/i)).toBeChecked();
  });

  it("selects and deletes users in edit mode", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText(/search a github username/i), "octo");

    await screen.findByText("octocat");

    await user.click(screen.getByRole("button", { name: /edit mode/i }));
    await user.click(screen.getByLabelText(/select octocat/i));

    expect(screen.getByText("1 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(screen.queryByText("octocat")).not.toBeInTheDocument();
    expect(screen.getByText("gaearon")).toBeInTheDocument();
  });

  it("duplicates selected users in edit mode", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText(/search a github username/i), "octo");

    await screen.findByText("octocat");

    await user.click(screen.getByRole("button", { name: /edit mode/i }));
    await user.click(screen.getByLabelText(/select octocat/i));
    await user.click(screen.getByRole("button", { name: /duplicate/i }));

    expect(screen.getAllByText("octocat")).toHaveLength(2);
    expect(screen.getByText("gaearon")).toBeInTheDocument();
    expect(screen.getByText("0 selected")).toBeInTheDocument();
  });
});
