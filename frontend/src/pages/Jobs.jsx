import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { Button, Card, Header } from "../components";
import { JobCard } from "../components/MarketplaceCards";
import { EmptyState, ErrorState, LoadingSkeleton } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { jobService } from "../services/api";

export default function Jobs() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    city: searchParams.get("city") || "",
  });
  const [form, setForm] = useState(filters);
  const [result, setResult] = useState({ content: [], totalPages: 0 });
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError("");

    jobService
      .getJobs({ ...filters, page, size: 10, status: "OPEN" })
      .then((response) => {
        if (active) setResult(response);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.data?.message ||
              requestError.message ||
              "Unable to load jobs.",
          );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, page, retry]);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const search = (event) => {
    event.preventDefault();
    const nextFilters = {
      search: form.search.trim(),
      category: form.category.trim(),
      city: form.city.trim(),
    };
    const nextParams = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
    });
    setSearchParams(nextParams);
    setFilters(nextFilters);
    setPage(0);
  };

  return (
    <div className="page-wrapper pb-8">
      <Header
        title="Find jobs"
        subtitle="Your next opportunity could be just around the corner."
      />
      <main className="content-container py-8 md:py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-neutral-600">
            Find local work and opportunities in your community.
          </p>
          <div className="flex gap-2">
            {isAuthenticated && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/my-applications")}
              >
                My applications
              </Button>
            )}
            {isAuthenticated && (
              <Button type="button" onClick={() => navigate("/jobs/new")}>
                Post a job
              </Button>
            )}
          </div>
        </div>

        <Card className="p-5 md:p-6">
          <form
            onSubmit={search}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <label className="text-sm font-semibold">
              Search jobs
              <input
                aria-label="Search jobs"
                name="search"
                className="input-field mt-1"
                value={form.search}
                onChange={updateField}
              />
            </label>
            <label className="text-sm font-semibold">
              Category
              <input
                aria-label="Filter jobs by category"
                name="category"
                className="input-field mt-1"
                value={form.category}
                onChange={updateField}
              />
            </label>
            <label className="text-sm font-semibold">
              City
              <input
                aria-label="Filter jobs by city"
                name="city"
                className="input-field mt-1"
                value={form.city}
                onChange={updateField}
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Search jobs
              </Button>
            </div>
          </form>
          {Object.values(form).some((value) => value.trim()) && (
            <Button
              type="button"
              variant="tertiary"
              className="mt-3"
              onClick={() => {
                const empty = { search: "", category: "", city: "" };
                setForm(empty);
                setFilters(empty);
                setPage(0);
                setSearchParams({});
              }}
            >
              Clear filters
            </Button>
          )}
        </Card>

        {isLoading ? (
          <LoadingSkeleton label="Loading local jobs" />
        ) : error ? (
          <ErrorState
            title="We couldn’t load local jobs"
            message={error}
            onRetry={() => setRetry((value) => value + 1)}
          />
        ) : result.content?.length ? (
          <>
            <section aria-label="Open jobs" className="space-y-3">
              {result.content.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onOpen={(id) => navigate(`/jobs/${id}`)}
                />
              ))}
            </section>
            {result.totalPages > 1 && (
              <nav
                className="flex items-center justify-between"
                aria-label="Job pages"
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
            title="No open jobs match your search yet."
            description="Try a different keyword, category or neighbourhood. New opportunities begin with a local connection."
            icon={Briefcase}
            data-testid="job-empty-state"
          />
        )}
      </main>
    </div>
  );
}
