import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { workerService } from '../services/api';

const blankProfile = {
  headline: '',
  bio: '',
  skills: '',
  serviceCategories: '',
  city: '',
  province: '',
};

const splitValues = (value) => [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];

export default function WorkerProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(blankProfile);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.accountType !== 'WORKER') {
      setError('Only worker accounts can manage a worker profile.');
      setIsLoading(false);
      return;
    }
    workerService.getMyProfile()
      .then((profile) => {
        setHasProfile(true);
        setForm({
          headline: profile.headline,
          bio: profile.bio,
          skills: profile.skills.join(', '),
          serviceCategories: profile.serviceCategories.join(', '),
          city: profile.city,
          province: profile.province,
        });
      })
      .catch((requestError) => {
        if (requestError.status !== 404) setError(requestError.data?.message || requestError.message);
      })
      .finally(() => setIsLoading(false));
  }, [user?.accountType]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    const payload = {
      headline: form.headline,
      bio: form.bio,
      skills: splitValues(form.skills),
      serviceCategories: splitValues(form.serviceCategories),
      city: form.city,
      province: form.province,
    };
    try {
      if (hasProfile) {
        await workerService.updateMyProfile(payload);
      } else {
        await workerService.createMyProfile(payload);
        setHasProfile(true);
      }
      setSuccess('Your worker profile has been saved.');
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header title="Worker profile" subtitle="Manage your public skills and service information" onBack={() => navigate('/home')} />
      <main className="page-content page-padding py-6 max-w-2xl mx-auto w-full">
        {isLoading ? <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div> : (
          <Card className="p-5">
            {error && <p role="alert" className="mb-4 text-sm text-red-700"><AlertCircle size={16} className="inline mr-2" />{error}</p>}
            {success && <p role="status" className="mb-4 text-sm text-green-700">{success}</p>}
            {user?.accountType === 'WORKER' && (
              <form className="space-y-4" onSubmit={submit}>
                <label className="block text-sm font-semibold">Professional headline
                  <input name="headline" className="input-field mt-1" maxLength={120} required value={form.headline} onChange={updateField} />
                </label>
                <label className="block text-sm font-semibold">About your work
                  <textarea name="bio" className="input-field mt-1 min-h-32" maxLength={2000} required value={form.bio} onChange={updateField} />
                </label>
                <label className="block text-sm font-semibold">Skills (comma separated)
                  <input name="skills" className="input-field mt-1" required value={form.skills} onChange={updateField} />
                </label>
                <label className="block text-sm font-semibold">Service categories (comma separated)
                  <input name="serviceCategories" className="input-field mt-1" required value={form.serviceCategories} onChange={updateField} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Township or city
                    <input name="city" className="input-field mt-1" required value={form.city} onChange={updateField} />
                  </label>
                  <label className="block text-sm font-semibold">Province
                    <input name="province" className="input-field mt-1" required value={form.province} onChange={updateField} />
                  </label>
                </div>
                <p className="text-xs text-neutral-600">Your email and phone number are never included in your public worker profile.</p>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : hasProfile ? 'Save changes' : 'Create worker profile'}</Button>
              </form>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
