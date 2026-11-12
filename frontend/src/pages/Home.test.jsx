import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";
import { businessService } from "../services/api";

vi.mock("../services/api", () => ({
  businessService: { getAllBusinesses: vi.fn() },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { firstName: "Amahle" } }),
}));

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="*" element={<p>Marketplace destination</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("Home marketplace navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    businessService.getAllBusinesses.mockResolvedValue({ content: [] });
  });

  it("searches the real worker directory and greets the signed-in user", async () => {
    const user = userEvent.setup();
    renderHome();

    expect(
      screen.getByRole("heading", { name: /Good .* Amahle/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Workers", exact: true }),
    );
    await user.type(
      screen.getByRole("searchbox", {
        name: "Search workers by name or skill...",
      }),
      "electrician",
    );
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/workers?search=electrician",
      ),
    );
  });

  it("links marketplace sections to supported directories without fabricated listings", async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.queryByText("1,240+")).not.toBeInTheDocument();
    expect(screen.queryByText("Sipho Dlamini")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Find local jobs" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/jobs"),
    );
  });

  it("opens the worker directory with a selected skill filter", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("button", { name: "Plumber" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/workers?skill=Plumber",
      ),
    );
  });

  it("searches the business directory from the primary hero search", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.type(screen.getByRole("searchbox"), "local cafe");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/explore?search=local+cafe",
      ),
    );
  });

  it("passes search and location to the real business directory", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.type(
      screen.getByRole("searchbox", { name: "What are you looking for?" }),
      "cafe",
    );
    await user.type(
      screen.getByLabelText("Around your neighbourhood"),
      "Soweto",
    );
    await user.click(screen.getByRole("button", { name: /Find businesses/ }));
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/explore?search=cafe&city=Soweto",
      ),
    );
  });
  it("filters API listings by category", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(
      screen.getByRole("button", { name: "Hair & beauty", exact: true }),
    );
    await waitFor(() =>
      expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({
        page: 0,
        size: 3,
        category: "Salon & Beauty",
      }),
    );
  });

  it("searches local jobs when the jobs scope is selected", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole("button", { name: "Jobs", exact: true }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search local jobs..." }),
      "plumbing",
    );
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/jobs?search=plumbing",
      ),
    );
  });

  it("renders actual API listing fields and opens the matching business", async () => {
    businessService.getAllBusinesses.mockResolvedValue({
      content: [
        {
          id: "shop-1",
          name: "API Community Shop",
          description: "From the server",
          category: "Retail",
          city: "Soweto",
          province: "Gauteng",
          averageRating: 4.5,
          reviewCount: 2,
        },
      ],
    });
    const user = userEvent.setup();
    renderHome();
    expect(await screen.findByText("API Community Shop")).toBeInTheDocument();
    expect(businessService.getAllBusinesses).toHaveBeenCalledWith({
      page: 0,
      size: 3,
    });
    expect(screen.getByText("No photo provided")).toBeInTheDocument();
    await user.click(
      screen.getByRole("link", {
        name: "View details for API Community Shop",
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/businesses/shop-1",
      ),
    );
  });

  it("shows an honest empty state without invented listings", async () => {
    renderHome();
    expect(
      await screen.findByText("Your neighbourhood starts with you"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("business-card-shop-1"),
    ).not.toBeInTheDocument();
  });

  it("distinguishes network failures from empty listings and retries", async () => {
    businessService.getAllBusinesses
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce({ content: [] });
    const user = userEvent.setup();
    renderHome();
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    expect(
      screen.queryByText("Your neighbourhood starts with you"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("Your neighbourhood starts with you"),
    ).toBeInTheDocument();
  });
});
