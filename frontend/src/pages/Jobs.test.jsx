import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Jobs from "./Jobs";
import { jobService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

vi.mock("../services/api", () => ({
  jobService: { getJobs: vi.fn() },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

function CurrentLocation() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

describe("Jobs directory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ isAuthenticated: false });
  });

  it("is public, filters jobs, and opens a job detail page", async () => {
    jobService.getJobs.mockResolvedValue({
      content: [
        {
          id: "job-1",
          title: "Electrician",
          employerName: "Amahle Dube",
          category: "Electrical",
          description: "Residential wiring and repairs.",
          employmentType: "FULL_TIME",
          city: "Soweto",
          province: "Gauteng",
        },
      ],
      totalPages: 1,
    });

    render(
      <MemoryRouter initialEntries={["/jobs"]}>
        <Routes>
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<p>Job detail route</p>} />
        </Routes>
        <CurrentLocation />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Electrician")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search jobs"), {
      target: { value: "wiring" },
    });
    fireEvent.change(screen.getByLabelText("Filter jobs by category"), {
      target: { value: "Electrical" },
    });
    fireEvent.change(screen.getByLabelText("Filter jobs by city"), {
      target: { value: "Soweto" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search jobs/i }));

    await waitFor(() => {
      expect(jobService.getJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: "wiring",
          category: "Electrical",
          city: "Soweto",
        }),
      );
    });
    expect(screen.getByTestId("location")).toHaveTextContent("search=wiring");
    fireEvent.click(screen.getByRole("button", { name: /Electrician/i }));
    expect(await screen.findByText("Job detail route")).toBeInTheDocument();
  });

  it("shows an explicit empty state", async () => {
    jobService.getJobs.mockResolvedValue({ content: [], totalPages: 0 });
    render(
      <MemoryRouter>
        <Jobs />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("job-empty-state")).toHaveTextContent(
      "No open jobs",
    );
  });

  it("shows failures instead of an empty success state", async () => {
    jobService.getJobs.mockRejectedValue(new Error("Job service unavailable"));
    render(
      <MemoryRouter>
        <Jobs />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Job service unavailable",
    );
  });

  it("retries a directory failure while retaining the URL filter", async () => {
    jobService.getJobs
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce({ content: [], totalPages: 0 });
    render(
      <MemoryRouter initialEntries={["/jobs?city=Soweto"]}>
        <Jobs />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("job-empty-state")).toBeInTheDocument();
    expect(jobService.getJobs).toHaveBeenLastCalledWith(
      expect.objectContaining({ city: "Soweto" }),
    );
  });

  it("clears the entered filters and search parameters together", async () => {
    jobService.getJobs.mockResolvedValue({ content: [], totalPages: 0 });
    render(
      <MemoryRouter initialEntries={["/jobs?city=Soweto"]}>
        <Jobs />
        <CurrentLocation />
      </MemoryRouter>,
    );
    await screen.findByTestId("job-empty-state");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() =>
      expect(jobService.getJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          city: "",
          search: "",
          category: "",
          page: 0,
        }),
      ),
    );
    expect(screen.getByLabelText("Filter jobs by city")).toHaveValue("");
    expect(screen.getByTestId("location")).toHaveTextContent("/jobs");
    expect(screen.getByTestId("location")).not.toHaveTextContent("city=");
  });
});
