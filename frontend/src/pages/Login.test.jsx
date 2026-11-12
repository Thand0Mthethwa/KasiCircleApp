import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";
import { useAuth } from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext", () => ({ useAuth: vi.fn() }));
const login = vi.fn();
function setup() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<p>Community home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Email account login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login, isLoading: false, error: null });
  });
  it("validates required fields without sending an empty login", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(
      screen.getByRole("button", { name: "Login", exact: true }),
    );
    expect(
      screen.getByRole("textbox", { name: "Email address" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
  it("authenticates with the entered email/password and redirects after success", async () => {
    login.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    setup();
    await user.type(
      screen.getByLabelText("Email address"),
      "member@example.test",
    );
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "TestPassword123!",
    );
    await user.click(
      screen.getByRole("button", { name: "Login", exact: true }),
    );
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith(
        "member@example.test",
        "TestPassword123!",
      ),
    );
    expect(await screen.findByText("Community home")).toBeInTheDocument();
  });
  it("reveals and conceals the password without clearing it", async () => {
    const user = userEvent.setup();
    setup();
    const password = screen.getByLabelText("Password", { exact: true });
    fireEvent.change(password, { target: { value: "Private test value" } });
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveValue("Private test value");
  });
  it("announces authentication failures and keeps the form available", () => {
    useAuth.mockReturnValue({
      login,
      isLoading: false,
      error: "Unable to sign in",
    });
    setup();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign in");
    expect(
      screen.getByRole("button", { name: "Login", exact: true }),
    ).toBeEnabled();
  });
  it("shows a disabled pending action without unsupported social/reset buttons", () => {
    useAuth.mockReturnValue({ login, isLoading: true, error: null });
    setup();
    expect(
      screen.getByRole("button", { name: "Logging in..." }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /Google|Phone|Forgot Password/i }),
    ).not.toBeInTheDocument();
  });
});
