import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NotFound from "./NotFound";
function setup() {
  return render(
    <MemoryRouter initialEntries={["/missing-page"]}>
      <Routes>
        <Route path="/home" element={<p>Marketplace home</p>} />
        <Route
          path="/explore"
          element={<p>Business directory destination</p>}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>,
  );
}
describe("Missing-page recovery", () => {
  it("opens the marketplace home from the recovery action", async () => {
    const user = userEvent.setup();
    setup();
    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go Home" }));
    expect(await screen.findByText("Marketplace home")).toBeInTheDocument();
  });
  it("offers a working business-directory destination", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(
      screen.getByRole("button", { name: "Explore businesses" }),
    );
    expect(
      await screen.findByText("Business directory destination"),
    ).toBeInTheDocument();
  });
});
