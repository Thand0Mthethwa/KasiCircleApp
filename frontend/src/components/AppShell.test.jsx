import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

const auth = { isAuthenticated: false, user: null, logout: vi.fn() };
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => auth }));
function Destination() {
  const { pathname } = useLocation();
  return <output data-testid="route">{pathname}</output>;
}
function setup() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <AppShell>
        <Destination />
      </AppShell>
    </MemoryRouter>,
  );
}

describe("Marketplace shell", () => {
  beforeEach(() => {
    auth.isAuthenticated = false;
    auth.user = null;
    vi.clearAllMocks();
  });

  it("provides guest authentication links and a skip link", () => {
    setup();
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: "Join the circle" }),
    ).toHaveAttribute("href", "/register");
    expect(screen.queryByLabelText("Account menu")).not.toBeInTheDocument();
  });

  it("opens the mobile menu, navigates and closes it on a route change", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(
      screen.getByRole("button", { name: "Close navigation" }),
    ).toHaveAttribute("aria-expanded", "true");
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Mobile marketplace" }),
      ).getByRole("link", { name: "Workers" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("route")).toHaveTextContent("/workers"),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Mobile marketplace" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("closes mobile navigation with Escape and returns keyboard focus", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("button", { name: "Open navigation" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Open navigation" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("shows only the signed-in account management destinations and supports logout", async () => {
    auth.isAuthenticated = true;
    auth.user = { firstName: "Amahle", accountType: "WORKER", role: "USER" };
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByLabelText("Account menu"));
    expect(
      screen.getByRole("link", { name: "Manage my worker profile" }),
    ).toHaveAttribute("href", "/worker-profile");
    expect(
      screen.queryByRole("link", { name: "Manage my business" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Content reports" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it("shows administrator access and closes the account menu with Escape", async () => {
    auth.isAuthenticated = true;
    auth.user = { firstName: "Admin", accountType: "BUSINESS", role: "ADMIN" };
    const user = userEvent.setup();
    setup();
    const summary = screen.getByLabelText("Account menu");
    await user.click(summary);
    expect(
      screen.getByRole("link", { name: "Content reports" }),
    ).toHaveAttribute("href", "/admin/reports");
    await user.keyboard("{Escape}");
    expect(summary.closest("details")).not.toHaveAttribute("open");
    expect(summary).toHaveFocus();
  });
});
