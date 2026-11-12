import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Onboarding from "./Onboarding";
import Welcome from "./Welcome";

function setup(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/home" element={<p>Marketplace home</p>} />
        <Route path="/login" element={<p>Login destination</p>} />
        <Route path="/register" element={<p>Register destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Community introduction", () => {
  it("continues from onboarding to welcome and allows guest browsing", async () => {
    const user = userEvent.setup();
    setup("/onboarding");
    expect(
      screen.getByRole("heading", { name: /Good things.*Closer to home/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByRole("heading", { name: /Welcome to.*the circle/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue as Guest" }));
    await waitFor(() =>
      expect(screen.getByText("Marketplace home")).toBeInTheDocument(),
    );
  });

  it("opens the existing registration route from welcome", async () => {
    const user = userEvent.setup();
    setup("/welcome");
    await user.click(screen.getByRole("button", { name: "Create Account" }));
    expect(await screen.findByText("Register destination")).toBeInTheDocument();
  });
});
