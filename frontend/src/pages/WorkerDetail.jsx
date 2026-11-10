import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, MapPin } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { workerService } from '../services/api';

export default function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [worker, setWorker] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    workerService.getWorkerById(id)
      .then((result) => { if (active) setWorker(result); })
      .catch((requestError) => { if (active) setError(requestError.data?.message || requestError.message || 'Unable to load this worker profile.'); });
    return () => { active = false; };
  }, [id]);

  return (
    <div className="page-wrapper">
      <Header title="Worker profile" onBack={() => navigate('/workers')} />
      <main className="page-content page-padding py-6 max-w-2xl mx-auto w-full">
        {!worker && !error && <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}
        {error && <Card className="p-5 text-red-700" role="alert"><AlertCircle className="inline mr-2" />{error}</Card>}
        {worker && (
          <Card className="p-6">
            <h1 className="text-2xl font-bold">{worker.displayName}</h1>
            <p className="mt-1 text-lg text-kasi-green font-semibold">{worker.headline}</p>
            <p className="mt-4 whitespace-pre-wrap text-neutral-700">{worker.bio}</p>
            <p className="mt-4 flex items-center gap-2 text-sm text-neutral-600"><MapPin size={16} />{worker.city}, {worker.province}</p>
            <section className="mt-6">
              <h2 className="font-semibold">Skills</h2>
              <ul className="mt-2 flex flex-wrap gap-2">{worker.skills.map((skill) => <li key={skill} className="rounded-full bg-neutral-100 px-3 py-1 text-sm">{skill}</li>)}</ul>
            </section>
            <section className="mt-5">
              <h2 className="font-semibold">Service categories</h2>
              <ul className="mt-2 flex flex-wrap gap-2">{worker.serviceCategories.map((category) => <li key={category} className="rounded-full bg-kasi-green-light px-3 py-1 text-sm">{category}</li>)}</ul>
            </section>
            <p className="mt-6 text-sm text-neutral-600">Contact details are private. Send a message to connect securely.</p>
            {isAuthenticated && user?.id !== worker.ownerId && (
              <Button
                type="button"
                className="mt-5"
                onClick={() => navigate(`/messages?participant=${worker.ownerId}`)}
              >
                Message worker
              </Button>
            )}
            <Button type="button" variant="secondary" className="mt-5" onClick={() => navigate('/workers')}>Back to workers</Button>
          </Card>
        )}
      </main>
    </div>
  );
}
