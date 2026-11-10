import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Briefcase, MapPin } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/api';
import ReportForm from '../components/ReportForm';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState(null);
  const [message, setMessage] = useState('');
  const [applications, setApplications] = useState([]);
  const [showApplications, setShowApplications] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadJob = useCallback(async () => {
    setError('');
    try {
      setJob(await jobService.getJobById(id));
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to load this job.');
    }
  }, [id]);

  useEffect(() => { loadJob(); }, [loadJob]);

  const isEmployer = job && user?.id === job.employerId;

  const loadApplications = async () => {
    setIsLoadingApplications(true);
    setError('');
    try {
      setApplications(await jobService.getApplicationsForJob(id));
      setShowApplications(true);
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to load applications.');
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const changeStatus = async (status) => {
    setError('');
    try {
      await jobService.updateJobStatus(id, status);
      await loadJob();
      setNotice(status === 'CLOSED' ? 'Job closed.' : 'Job reopened.');
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to update job status.');
    }
  };

  const apply = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await jobService.applyForJob(id, message);
      setNotice('Your application has been submitted.');
      setMessage('');
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to submit your application.');
    }
  };

  const updateApplication = async (applicationId, status) => {
    setError('');
    try {
      await jobService.updateApplicationStatus(id, applicationId, status);
      setApplications((current) => current.map((application) =>
        application.id === applicationId ? { ...application, status } : application));
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to update application.');
    }
  };

  return (
    <div className="page-wrapper pb-8">
      <Header title="Job details" onBack={() => navigate('/jobs')} />
      <main className="page-content page-padding py-6 max-w-3xl mx-auto w-full space-y-4">
        {!job && !error && <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}
        {error && <Card className="p-4 text-red-700" role="alert"><AlertCircle className="inline mr-2" />{error}</Card>}
        {notice && <p role="status" className="text-green-700">{notice}</p>}
        {job && (
          <>
            <Card className="p-6">
              <p className="text-sm font-semibold text-kasi-green">{job.status}</p>
              <h1 className="mt-1 text-2xl font-bold">{job.title}</h1>
              <p className="mt-2 text-neutral-600">{job.employerName} · {job.category} · {job.employmentType.replaceAll('_', ' ').toLowerCase()}</p>
              <p className="mt-4 flex items-center gap-2 text-sm text-neutral-600"><MapPin size={16} />{job.city}, {job.province}</p>
              <p className="mt-5 whitespace-pre-wrap text-neutral-800">{job.description}</p>
              <ReportForm targetType="JOB" targetId={job.id} />
              <p className="mt-5 text-sm text-neutral-600">Employer contact information is private. Applications are shared only with this job's employer.</p>
              {!isEmployer && isAuthenticated && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-5"
                  onClick={() => navigate(`/messages?participant=${job.employerId}`)}
                >
                  Message employer
                </Button>
              )}
              {isEmployer && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {job.status === 'OPEN' && <Button type="button" variant="secondary" onClick={() => navigate(`/jobs/${id}/edit`)}>Edit job</Button>}
                  <Button type="button" variant="secondary" onClick={() => changeStatus(job.status === 'OPEN' ? 'CLOSED' : 'OPEN')}>
                    {job.status === 'OPEN' ? 'Close job' : 'Reopen job'}
                  </Button>
                  <Button type="button" onClick={loadApplications} disabled={isLoadingApplications}>
                    {isLoadingApplications ? 'Loading…' : 'View applications'}
                  </Button>
                </div>
              )}
              {!isEmployer && job.status === 'OPEN' && isAuthenticated && (
                <form onSubmit={apply} className="mt-6 space-y-3">
                  <label className="block text-sm font-semibold">Application message
                    <textarea aria-label="Application message" className="input-field mt-1 min-h-28" maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} />
                  </label>
                  <Button type="submit">Apply for this job</Button>
                </form>
              )}
              {!isEmployer && job.status === 'OPEN' && !isAuthenticated && (
                <p className="mt-6 text-sm"> <Link className="text-kasi-green underline" to="/login">Sign in</Link> to apply.</p>
              )}
              {job.status === 'CLOSED' && <p className="mt-6 font-semibold text-neutral-600">This job is closed and no longer accepting applications.</p>}
            </Card>
            {isEmployer && showApplications && (
              <section aria-label="Job applications">
                <h2 className="mb-3 text-xl font-bold">Applications ({applications.length})</h2>
                {applications.length === 0 ? <Card className="p-5 text-neutral-600">No applications yet.</Card> : (
                  <div className="space-y-3">
                    {applications.map((application) => (
                      <Card key={application.id} className="p-5">
                        <h3 className="font-bold">{application.applicantName}</h3>
                        <p className="mt-2 text-sm text-neutral-700">{application.message || 'No message provided.'}</p>
                        <p className="mt-2 text-sm text-neutral-600">Status: {application.status}</p>
                        {application.status === 'PENDING' && <div className="mt-3 flex gap-2">
                          <Button type="button" onClick={() => updateApplication(application.id, 'ACCEPTED')}>Accept</Button>
                          <Button type="button" variant="secondary" onClick={() => updateApplication(application.id, 'REJECTED')}>Decline</Button>
                        </div>}
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}
            {isEmployer && <p className="text-sm text-neutral-600"><Briefcase className="inline mr-1" size={16} />Applicant contact details are private; use messaging when available.</p>}
          </>
        )}
      </main>
    </div>
  );
}
