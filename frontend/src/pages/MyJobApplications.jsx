import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { jobService } from '../services/api';

export default function MyJobApplications() {
  const navigate = useNavigate();
  const [result, setResult] = useState({ content: [], totalPages: 0 });
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setResult(await jobService.getMyApplications(page, 10));
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to load your applications.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  return (
    <div className="page-wrapper pb-8">
      <Header title="My applications" onBack={() => navigate('/jobs')} />
      <main className="page-content page-padding py-6 max-w-3xl mx-auto w-full space-y-4">
        {isLoading ? (
          <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <Card className="p-5 text-red-700" role="alert"><AlertCircle className="inline mr-2" />{error}</Card>
        ) : result.content?.length ? (
          <>
            <section aria-label="Your job applications" className="space-y-3">
              {result.content.map((application) => (
                <Card key={application.id} className="p-5">
                  <h2 className="font-bold text-lg">{application.jobTitle}</h2>
                  <p className="text-sm text-neutral-600">Employer: {application.employerName} · Status: {application.status}</p>
                  {application.message && <p className="mt-3 whitespace-pre-wrap text-sm">{application.message}</p>}
                  <Link className="mt-3 inline-block text-kasi-green underline" to={`/jobs/${application.jobId}`}>View job</Link>
                </Card>
              ))}
            </section>
            {result.totalPages > 1 && (
              <nav className="flex items-center justify-between" aria-label="Application pages">
                <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <span aria-live="polite">Page {page + 1} of {result.totalPages}</span>
                <Button type="button" variant="secondary" disabled={page + 1 >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </nav>
            )}
          </>
        ) : (
          <Card className="p-8 text-center text-neutral-600" data-testid="applications-empty-state">
            <Briefcase className="mx-auto mb-2" />
            <p>You have not applied to any jobs yet.</p>
            <Button className="mt-4" type="button" onClick={() => navigate('/jobs')}>Browse jobs</Button>
          </Card>
        )}
      </main>
    </div>
  );
}
