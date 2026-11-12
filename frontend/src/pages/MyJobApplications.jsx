import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { Button, Card, Header, LoadingSpinner } from "../components";
import { jobService } from "../services/api";
import { EmptyState, ErrorState, StatusBadge } from "../components/ui";

export default function MyJobApplications() {
  const navigate = useNavigate();
  const [result, setResult] = useState({ content: [], totalPages: 0 });
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setResult(await jobService.getMyApplications(page, 10));
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to load your applications.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  return (
    <div className="page-wrapper pb-8">
      <Header
        title="My applications"
        subtitle="Keep track of the opportunities you’ve taken a step towards."
        onBack={() => navigate("/jobs")}
      />
      <main className="content-container py-8 md:py-10 space-y-5">
        {isLoading ? (
          <div role="status" className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <ErrorState
            title="We couldn’t load your applications"
            message={error}
            onRetry={loadApplications}
          />
        ) : result.content?.length ? (
          <>
            <section aria-label="Your job applications" className="space-y-3">
              {result.content.map((application) => (
                <Card key={application.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-xl">
                      {application.jobTitle}
                    </h2>
                    <StatusBadge status={application.status}>
                      Status: {application.status}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">
                    Employer: {application.employerName}
                  </p>
                  {application.message && (
                    <p className="mt-3 whitespace-pre-wrap text-sm">
                      {application.message}
                    </p>
                  )}
                  <Link
                    className="mt-3 inline-block text-kasi-green underline"
                    to={`/jobs/${application.jobId}`}
                  >
                    View job
                  </Link>
                </Card>
              ))}
            </section>
            {result.totalPages > 1 && (
              <nav
                className="flex items-center justify-between"
                aria-label="Application pages"
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
                  Page {page + 1} of {result.totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page + 1 >= result.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            title="You have not applied to any jobs yet."
            description="Find an opportunity that fits your skills and take the next step."
            icon={Briefcase}
            data-testid="applications-empty-state"
            action={
              <Button
                className="mt-2"
                type="button"
                onClick={() => navigate("/jobs")}
              >
                Browse jobs
              </Button>
            }
          />
        )}
      </main>
    </div>
  );
}
