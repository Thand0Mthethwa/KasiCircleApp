import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/api';

const initialForm = {
  title: '',
  description: '',
  category: '',
  employmentType: 'FULL_TIME',
  city: '',
  province: '',
};

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    jobService.getJobById(id)
      .then((job) => {
        if (job.employerId !== user?.id) {
          setError('Only the employer who posted this job may edit it.');
          return;
        }
        setForm({
          title: job.title,
          description: job.description,
          category: job.category,
          employmentType: job.employmentType,
          city: job.city,
          province: job.province,
        });
      })
      .catch((requestError) => setError(requestError.data?.message || requestError.message || 'Unable to load this job.'))
      .finally(() => setIsLoading(false));
  }, [id, user?.id]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const job = id ? await jobService.updateJob(id, form) : await jobService.createJob(form);
      navigate(`/jobs/${job.id}`);
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to save this job.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header title={id ? 'Edit job' : 'Post a job'} onBack={() => navigate(id ? `/jobs/${id}` : '/jobs')} />
      <main className="page-content page-padding py-6 max-w-2xl mx-auto w-full">
        {isLoading ? <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div> : (
          <Card className="p-5">
            {error && <p role="alert" className="mb-4 text-red-700"><AlertCircle className="inline mr-2" />{error}</p>}
            {!error && <form className="space-y-4" onSubmit={submit}>
              <label className="block text-sm font-semibold">Job title
                <input name="title" className="input-field mt-1" maxLength={120} required value={form.title} onChange={updateField} />
              </label>
              <label className="block text-sm font-semibold">Description
                <textarea name="description" className="input-field mt-1 min-h-40" maxLength={4000} required value={form.description} onChange={updateField} />
              </label>
              <label className="block text-sm font-semibold">Service category
                <input name="category" className="input-field mt-1" maxLength={60} required value={form.category} onChange={updateField} />
              </label>
              <label className="block text-sm font-semibold">Employment type
                <select name="employmentType" className="input-field mt-1" value={form.employmentType} onChange={updateField}>
                  <option value="FULL_TIME">Full time</option>
                  <option value="PART_TIME">Part time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="TEMPORARY">Temporary</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Township or city
                  <input name="city" className="input-field mt-1" maxLength={100} required value={form.city} onChange={updateField} />
                </label>
                <label className="block text-sm font-semibold">Province
                  <input name="province" className="input-field mt-1" maxLength={100} required value={form.province} onChange={updateField} />
                </label>
              </div>
              <p className="text-xs text-neutral-600">Your contact details are not shown publicly with the job listing.</p>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : id ? 'Save changes' : 'Publish job'}</Button>
            </form>}
          </Card>
        )}
      </main>
    </div>
  );
}
