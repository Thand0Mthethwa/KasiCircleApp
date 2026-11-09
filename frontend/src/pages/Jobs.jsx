import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Briefcase, MapPin, Search } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/api';

export default function Jobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
  });
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ content: [], totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setResult(await jobService.getJobs({ ...filters, page, size: 10 }));
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to load jobs.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const submit = (event) => {
    event.preventDefault();
    const nextFilters = { search: search.trim(), category: category.trim(), city: city.trim() };
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    setSearchParams(params, { replace: true });
    setFilters(nextFilters);
    setPage(0);
  };

  return (
    <div className="page-wrapper pb-8">
      <Header title="Local Jobs" subtitle="Find work and opportunities in your community" onBack={() => navigate('/home')} />
      <main className="page-content page-padding py-6 max-w-3xl mx-auto w-full space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">Browse open opportunities near you.</p>
          <div className="flex flex-wrap gap-2">
            {isAuthenticated && <Button type="button" variant="secondary" onClick={() => navigate('/my-applications')}>My applications</Button>}
            {isAuthenticated && <Button type="button" onClick={() => navigate('/jobs/new')}>Post a job</Button>}
          </div>
        </div>
        <form onSubmit={submit} role="search" className="space-y-3">
          <label className="block text-sm font-semibold">Job or employer
            <input aria-label="Search jobs" className="input-field mt-1" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Category
              <input aria-label="Filter jobs by category" className="input-field mt-1" value={category} onChange={(event) => setCategory(event.target.value)} />
            </label>
            <label className="block text-sm font-semibold"><span className="flex items-center gap-1"><MapPin aria-hidden="true" size={16} />Township or city</span>
              <input aria-label="Filter jobs by city" className="input-field mt-1" value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
          </div>
          <Button type="submit"><Search size={16} className="inline mr-2" />Search jobs</Button>
        </form>

        {isLoading ? (
          <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <Card className="p-5 text-red-700" role="alert"><AlertCircle className="inline mr-2" />{error}</Card>
        ) : result.content?.length ? (
          <>
            <div className="space-y-3" aria-label="Open jobs">
              {result.content.map((job) => (
                <button key={job.id} type="button" className="w-full text-left" onClick={() => navigate(`/jobs/${job.id}`)}>
                  <Card className="p-5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-kasi-green">
                    <div className="flex items-start gap-3">
                      <Briefcase className="mt-1 shrink-0 text-kasi-green" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-lg">{job.title}</h2>
                        <p className="text-sm text-neutral-600">{job.employerName} · {job.category}</p>
                        <p className="mt-2 text-sm text-neutral-700 line-clamp-2">{job.description}</p>
                        <p className="mt-2 text-sm text-neutral-600">{job.city}, {job.province} · {job.employmentType.replaceAll('_', ' ').toLowerCase()}</p>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
            {result.totalPages > 1 && (
              <nav className="flex items-center justify-between" aria-label="Job pages">
                <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <span aria-live="polite">Page {page + 1} of {result.totalPages}</span>
                <Button type="button" variant="secondary" disabled={page + 1 >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </nav>
            )}
          </>
        ) : (
          <Card className="p-8 text-center text-neutral-600" data-testid="job-empty-state">
            <Briefcase className="mx-auto mb-2" />
            <p>No open jobs match your search.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
