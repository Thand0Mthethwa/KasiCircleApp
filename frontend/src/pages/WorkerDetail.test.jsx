import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkerDetail from "./WorkerDetail";
import { workerService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

vi.mock("../services/api", () => ({
  workerService: {
    getWorkerById: vi.fn(),
  },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("WorkerDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });
  });

  it("renders public profile skills and service location without personal contact", async () => {
    workerService.getWorkerById.mockResolvedValue({
      id: "profile-1",
      ownerId: "worker-1",
      displayName: "Amahle Dube",
      headline: "Electrician",
      bio: "Home wiring.",
      skills: ["Wiring"],
      serviceCategories: ["Electrical"],
      city: "Soweto",
      province: "Gauteng",
      email: "private@example.com",
      phoneNumber: "private",
    });
    render(
      <MemoryRouter initialEntries={["/workers/profile-1"]}>
        <Routes>
          <Route path="/workers/:id" element={<WorkerDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Amahle Dube" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Wiring")).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });

  it("lets an authenticated visitor message the profile owner without exposing contact data", async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "visitor-1" },
    });
    workerService.getWorkerById.mockResolvedValue({
      id: "profile-1",
      ownerId: "worker-1",
      displayName: "Amahle Dube",
      headline: "Electrician",
      bio: "Home wiring.",
      skills: ["Wiring"],
      serviceCategories: ["Electrical"],
      city: "Soweto",
      province: "Gauteng",
    });

    render(
      <MemoryRouter initialEntries={["/workers/profile-1"]}>
        <Routes>
          <Route path="/workers/:id" element={<WorkerDetail />} />
          <Route path="/messages" element={<p>Messages route</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Message worker" }),
    );
    expect(await screen.findByText("Messages route")).toBeInTheDocument();
  });

  it("shows the API error when a profile cannot be loaded", async () => {
    workerService.getWorkerById.mockRejectedValue(
      new Error("Worker not found"),
    );
    render(
      <MemoryRouter initialEntries={["/workers/missing"]}>
        <Routes>
          <Route path="/workers/:id" element={<WorkerDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Worker not found",
    );
  });

  it("retries loading a profile after a temporary failure", async () => {
    workerService.getWorkerById
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce({
        id: "profile-1",
        displayName: "Recovered Worker",
        headline: "Repairs",
        skills: [],
        serviceCategories: [],
      });
    render(
      <MemoryRouter initialEntries={["/workers/profile-1"]}>
        <Routes>
          <Route path="/workers/:id" element={<WorkerDetail />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "Recovered Worker" }),
    ).toBeInTheDocument();
  });
});
