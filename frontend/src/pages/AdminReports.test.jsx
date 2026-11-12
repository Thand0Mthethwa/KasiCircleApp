import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminReports from "./AdminReports";
import { reportService } from "../services/api";

vi.mock("../services/api", () => ({
  reportService: {
    getOpenReports: vi.fn(),
    moderateReport: vi.fn(),
  },
}));

const report = {
  id: "report-1",
  targetType: "JOB",
  targetId: "job-1",
  targetSummary: "Electrician: Residential wiring and repairs.",
  reason: "FRAUD",
  details: "Suspicious listing",
  status: "OPEN",
  createdAt: "2026-01-01T10:00:00Z",
};

describe("AdminReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportService.getOpenReports.mockResolvedValue({
      content: [report],
      totalPages: 1,
    });
    reportService.moderateReport.mockResolvedValue({
      ...report,
      status: "ACTIONED",
    });
  });

  it("lets admins review and resolve reports without displaying reporter identity", async () => {
    render(
      <MemoryRouter>
        <AdminReports />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Suspicious listing")).toBeInTheDocument();
    expect(
      screen.getByText("Electrician: Residential wiring and repairs."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/reporter/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Moderation note (optional)"), {
      target: { value: "Content removed." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Mark actioned" }));

    await waitFor(() =>
      expect(reportService.moderateReport).toHaveBeenCalledWith("report-1", {
        status: "ACTIONED",
        moderationNote: "Content removed.",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "marked actioned",
    );
  });

  it("shows an explicit loading error", async () => {
    reportService.getOpenReports.mockRejectedValue(
      new Error("Moderation queue unavailable"),
    );
    render(
      <MemoryRouter>
        <AdminReports />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Moderation queue unavailable",
    );
  });

  it("shows an explicit empty queue state", async () => {
    reportService.getOpenReports.mockResolvedValue({
      content: [],
      totalPages: 0,
    });
    render(
      <MemoryRouter>
        <AdminReports />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("reports-empty-state")).toHaveTextContent(
      "No open content reports",
    );
  });

  it("refreshes the moderation queue after a temporary failure", async () => {
    reportService.getOpenReports.mockRejectedValueOnce(new Error("Offline"));
    render(
      <MemoryRouter>
        <AdminReports />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    fireEvent.click(screen.getByRole("button", { name: "Refresh reports" }));
    expect(await screen.findByText("Suspicious listing")).toBeInTheDocument();
  });
});
