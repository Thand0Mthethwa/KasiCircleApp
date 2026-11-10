import { createElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Briefcase, Building2, Scissors, Wrench, Zap } from 'lucide-react';
import { BottomNavigation, SearchBar } from '../components';
import { useAuth } from '../contexts/AuthContext';

const workerSkills = [
  { label: 'Electrician', icon: Zap },
  { label: 'Plumber', icon: Wrench },
  { label: 'Mechanic', icon: Briefcase },
  { label: 'Hairdresser', icon: Scissors },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    const queryString = params.toString();
    navigate(`/workers${queryString ? `?${queryString}` : ''}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-wrapper pb-24">
      <header className="bg-kasi-green text-white page-padding py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm opacity-90">Your local marketplace</p>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {getGreeting()}, {user?.firstName || 'Guest'}!
          </h1>
          <p className="text-sm opacity-90">Find trusted local workers, jobs, and businesses.</p>
        </div>
      </header>

      <main className="page-content page-padding py-6 space-y-8 max-w-6xl w-full mx-auto">
        <section aria-labelledby="worker-search-heading" className="space-y-3">
          <h2 id="worker-search-heading" className="text-lg font-bold text-neutral-900">
            Find a local worker
          </h2>
          <SearchBar
            placeholder="Search workers by name or skill..."
            onSearch={handleSearch}
          />
        </section>

        <section aria-labelledby="marketplace-heading">
          <h2 id="marketplace-heading" className="text-lg font-bold text-neutral-900 mb-4">
            Explore the marketplace
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate('/workers')}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:border-kasi-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-kasi-green"
            >
              <Wrench aria-hidden="true" className="h-6 w-6 text-kasi-green" />
              <span className="font-semibold">Browse workers</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:border-kasi-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-kasi-green"
            >
              <Briefcase aria-hidden="true" className="h-6 w-6 text-kasi-green" />
              <span className="font-semibold">Find local jobs</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:border-kasi-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-kasi-green"
            >
              <Building2 aria-hidden="true" className="h-6 w-6 text-kasi-green" />
              <span className="font-semibold">Explore businesses</span>
            </button>
          </div>
        </section>

        <section aria-labelledby="skills-heading">
          <h2 id="skills-heading" className="text-lg font-bold text-neutral-900 mb-4">
            Find workers by skill
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {workerSkills.map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(`/workers?skill=${encodeURIComponent(label)}`)}
                className="flex flex-col items-center gap-2 rounded-xl bg-neutral-100 p-4 hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kasi-green"
              >
                {createElement(icon, { 'aria-hidden': true, className: 'h-6 w-6 text-kasi-green' })}
                <span className="text-sm font-semibold text-neutral-900">{label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <BottomNavigation active="home" onNavigate={navigate} />
    </div>
  );
}
