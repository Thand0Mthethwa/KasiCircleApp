import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, MapPin, Search, UserRound, X } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { workerService } from '../services/api';

export default function Workers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [skill, setSkill] = useState(searchParams.get('skill') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    skill: searchParams.get('skill') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
  });
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await workerService.getWorkers({ ...filters, page: 0, size: 20 });
      setWorkers(result.content || []);
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to load workers.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

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
  };

  const hasFilters = search || skill || category || city;

  return (
    <div className="page-wrapper pb-8">
      <Header title="Find Local Workers" subtitle="Discover skills and services in your community" onBack={() => navigate('/home')} />
      <main className="page-content page-padding py-6 max-w-2xl mx-auto w-full space-y-5">
        <form onSubmit={submitSearch} role="search" className="space-y-3">
          <label className="block text-sm font-semibold" htmlFor="worker-search">Name or keyword</label>
          <input id="worker-search" className="input-field" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold">
              Skill
              <input aria-label="Filter by skill" className="input-field" value={skill} onChange={(event) => setSkill(event.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Service category
              <input aria-label="Filter by service category" className="input-field" value={category} onChange={(event) => setCategory(event.target.value)} />
            </label>
          </div>
          <label className="block space-y-1 text-sm font-semibold">
            <span className="flex items-center gap-1"><MapPin aria-hidden="true" size={16} />Township or city</span>
            <input aria-label="Filter workers by city" className="input-field" value={city} onChange={(event) => setCity(event.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button type="submit"><Search size={16} className="inline mr-2" />Search</Button>
            {hasFilters && (
              <Button type="button" variant="secondary" onClick={() => {
                setSearch('');
                setSkill('');
                setCategory('');
                setCity('');
                setFilters({ search: '', skill: '', category: '', city: '' });
                setSearchParams({}, { replace: true });
              }}>Clear filters <X size={15} className="inline ml-1" /></Button>
            )}
          </div>
        </form>

        {isLoading ? (
          <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <Card className="p-5 text-red-700" role="alert"><AlertCircle className="inline mr-2" />{error}</Card>
        ) : workers.length === 0 ? (
          <Card className="p-8 text-center text-neutral-600" data-testid="worker-empty-state">
            <UserRound className="mx-auto mb-2" />
            <p>No workers match these filters yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2" aria-label="Worker directory">
            {workers.map((worker) => (
              <button key={worker.id} type="button" onClick={() => navigate(`/workers/${worker.id}`)} className="text-left">
                <Card className="h-full p-5 hover:shadow-md focus-within:ring-2 focus-within:ring-kasi-green">
                  <h2 className="font-bold text-lg">{worker.displayName}</h2>
                  <p className="text-kasi-green font-semibold">{worker.headline}</p>
                  <p className="mt-2 text-sm text-neutral-600 line-clamp-3">{worker.bio}</p>
                  <p className="mt-3 text-sm text-neutral-600">{worker.city}, {worker.province}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {worker.skills.map((item) => <span key={item} className="rounded-full bg-neutral-100 px-2 py-1 text-xs">{item}</span>)}
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
