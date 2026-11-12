import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Button, Card, Header, LoadingSpinner } from "../components";
import { reportService } from "../services/api";
import { EmptyState, StatusBadge } from "../components/ui";

const targetPath = (report) => {
  if (report.targetType === "JOB") return `/jobs/${report.targetId}`;
  if (report.targetType === "BUSINESS") return `/businesses/${report.targetId}`;
  if (report.targetType === "WORKER_PROFILE")
    return `/workers/${report.targetId}`;
  return null;
};

export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [notes, setNotes] = useState({});
  const [moderatingId, setModeratingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await reportService.getOpenReports(page, 20);
      setReports(result.content || []);
      setTotalPages(result.totalPages || 0);
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to load reports.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const decide = async (report, status) => {
    setError("");
    setNotice("");
    setModeratingId(report.id);
    try {
      await reportService.moderateReport(report.id, {
        status,
        moderationNote: notes[report.id]?.trim() || null,
      });
      setReports((current) => current.filter((item) => item.id !== report.id));
      setNotice(
        `Report ${status === "ACTIONED" ? "marked actioned" : "dismissed"}.`,
      );
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to update this report.",
      );
    } finally {
      setModeratingId("");
    }
  };

  return (
    <div className="page-wrapper pb-8">
      <Header
        title="Content reports"
        subtitle="A considered review helps keep the circle useful and welcoming."
        onBack={() => navigate("/profile")}
      />
      <main className="content-container py-8 md:py-10 space-y-5">
        <p className="flex items-center gap-2 text-sm text-neutral-600">
          <ShieldAlert size={18} />
          Open reports are visible to administrators only.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={loadReports}
          disabled={isLoading}
        >
          Refresh reports
        </Button>
        {error && (
          <Card role="alert" className="p-4 text-red-700">
            <AlertCircle className="inline mr-2" />
            {error}
          </Card>
        )}
        {notice && (
          <p role="status" className="text-green-700">
            {notice}
          </p>
        )}
        {isLoading ? (
          <div role="status" className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : reports.length ? (
          <>
            <section aria-label="Open reports" className="space-y-3">
              {reports.map((report) => {
                const path = targetPath(report);
                return (
                  <Card key={report.id} className="space-y-4 p-6 md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold text-lg">
                          {report.targetType.replaceAll("_", " ")} report
                        </h2>
                        <p className="text-sm text-neutral-600">
                          Reason: {report.reason.toLowerCase()}
                        </p>
                      </div>
                      <time
                        className="text-xs text-neutral-500"
                        dateTime={report.createdAt}
                      >
                        {new Date(report.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <StatusBadge status="OPEN">Awaiting review</StatusBadge>
                    <p className="break-all text-xs text-neutral-600">
                      Content ID: {report.targetId}
                    </p>
                    {report.targetSummary && (
                      <p className="whitespace-pre-wrap text-sm text-neutral-800">
                        {report.targetSummary}
                      </p>
                    )}
                    {report.details && (
                      <p className="whitespace-pre-wrap text-sm">
                        {report.details}
                      </p>
                    )}
                    {path && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate(path)}
                      >
                        View reported content
                      </Button>
                    )}
                    <label className="block text-sm font-medium">
                      Moderation note (optional)
                      <textarea
                        className="input-field mt-1 min-h-20"
                        maxLength={1000}
                        value={notes[report.id] || ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [report.id]: event.target.value,
                          }))
                        }
                        disabled={moderatingId === report.id}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={moderatingId === report.id}
                        onClick={() => decide(report, "ACTIONED")}
                      >
                        {moderatingId === report.id
                          ? "Saving…"
                          : "Mark actioned"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={moderatingId === report.id}
                        onClick={() => decide(report, "DISMISSED")}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </section>
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-between"
                aria-label="Report pages"
              >
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <span aria-live="polite">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            title="No open content reports."
            description="The review queue is clear. New community reports will appear here."
            icon={ShieldAlert}
            data-testid="reports-empty-state"
          />
        )}
      </main>
    </div>
  );
}
