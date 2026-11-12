import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Search, UserRound, X } from "lucide-react";
import { Button, Header, Input, WorkerCard } from "../components";
import { EmptyState, ErrorState, LoadingSkeleton } from "../components/ui";
import { workerService } from "../services/api";

export default function Workers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [skill, setSkill] = useState(searchParams.get("skill") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    skill: searchParams.get("skill") || "",
    category: searchParams.get("category") || "",
    city: searchParams.get("city") || "",
  });
  const [workers, setWorkers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await workerService.getWorkers({
        ...filters,
        page,
        size: 20,
      });
      setWorkers(result.content || []);
      setTotalPages(result.totalPages || 0);
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to load workers.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const submitSearch = (event) => {
    event.preventDefault();
    const nextFilters = {
      search: search.trim(),
      skill: skill.trim(),
      category: category.trim(),
      city: city.trim(),
    };
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([name, value]) => {
      if (value) params.set(name, value);
    });
    setSearchParams(params, { replace: true });
    setFilters(nextFilters);
    setPage(0);
  };

  const hasFilters = search || skill || category || city;

  return (
    <div className="page-wrapper pb-8">
      <Header
        title="Find Local Workers"
        subtitle="Discover skills and services in your community"
        onBack={() => navigate("/home")}
      />
      <main className="content-container py-8 md:py-10 space-y-6">
        <form
          onSubmit={submitSearch}
          role="search"
          className="filter-panel space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              id="worker-search"
              label="Name or keyword"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Who can help?"
            />
            <Input
              id="worker-skill"
              label="Skill"
              aria-label="Filter by skill"
              value={skill}
              onChange={(event) => setSkill(event.target.value)}
              placeholder="e.g. Wiring"
            />
            <Input
              id="worker-category"
              label="Service category"
              aria-label="Filter by service category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Electrical"
            />
            <Input
              id="worker-city"
              label="Township or city"
              aria-label="Filter workers by city"
              icon={MapPin}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Your neighbourhood"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              <Search size={16} className="inline mr-2" />
              Search
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setSkill("");
                  setCategory("");
                  setCity("");
                  setFilters({ search: "", skill: "", category: "", city: "" });
                  setPage(0);
                  setSearchParams({}, { replace: true });
                }}
              >
                Clear filters <X size={15} className="inline ml-1" />
              </Button>
            )}
          </div>
        </form>

        {isLoading ? (
          <LoadingSkeleton label="Loading local workers" />
        ) : error ? (
          <ErrorState
            title="We couldn’t load local workers"
            message={error}
            onRetry={loadWorkers}
          />
        ) : workers.length === 0 ? (
          <EmptyState
            title="No workers match these filters yet."
            description="Try a different skill or neighbourhood. Local talent can be closer than you think."
            icon={UserRound}
            data-testid="worker-empty-state"
          />
        ) : (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Worker directory"
          >
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onClick={() => navigate(`/workers/${worker.id}`)}
              />
            ))}
          </div>
        )}
        {!isLoading && !error && totalPages > 1 && (
          <nav
            aria-label="Worker pages"
            className="flex items-center justify-between"
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
      </main>
    </div>
  );
}
