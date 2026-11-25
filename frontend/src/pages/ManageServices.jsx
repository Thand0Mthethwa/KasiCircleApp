import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components';
import { CommercePage, Field, Pagination, ResourceFeedback, fieldStyle, useCommerceMutation } from '../components/commerce/CommerceUI';
import { OfferingDetails } from '../components/commerce/ProviderServices';
import { isProvider } from '../components/commerce/commerce';
import useCommerceResource from '../components/commerce/useCommerceResource';
import { useAuth } from '../contexts/AuthContext';
import { businessService, commerceService, workerService } from '../services/api';

function ServiceForm({ offering, categories, onSaved, onClose }) {
  const [model, setModel] = useState(offering?.priceModel || 'FIXED');
  const mutation = useCommerceMutation();

  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    mutation.run(async () => {
      await commerceService.save(offering?.id, {
        name: fields.get('name'),
        description: fields.get('description'),
        category: fields.get('category'),
        priceModel: model,
        price: model === 'QUOTE' ? null : fields.get('price'),
        durationMinutes: Number(fields.get('duration')),
        active: fields.has('active'),
      });
      onSaved();
    });
  }

  return (
    <Card className="p-5">
      <form className="space-y-4" onSubmit={submit}>
        <h2 className="font-semibold text-lg">{offering ? 'Edit service' : 'New service'}</h2>
        <Field label="Service name" name="name" required maxLength={120} defaultValue={offering?.name} />
        <Field label="Description" name="description" multiline required maxLength={2000} defaultValue={offering?.description} />
        <Field label="Category">
          <select className={fieldStyle} name="category" required defaultValue={categories.includes(offering?.category) ? offering.category : categories[0]}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </Field>
        <Field label="Pricing">
          <select className={fieldStyle} value={model} onChange={(event) => setModel(event.target.value)}>
            <option value="FIXED">Fixed price</option>
            <option value="STARTING">Starting price</option>
            <option value="QUOTE">Quotation required</option>
          </select>
        </Field>
        {model !== 'QUOTE' && <Field label="Price (ZAR)" name="price" type="number" min="0" max="9999999999.99" step="0.01" required defaultValue={offering?.price ?? ''} />}
        <Field label="Estimated duration (minutes)" name="duration" type="number" min="15" max="1440" required defaultValue={offering?.durationMinutes ?? 60} />
        <label className="flex items-center gap-3 min-h-11">
          <input className="size-5" type="checkbox" name="active" defaultChecked={offering?.active ?? true} />
          Show this service on my profile
        </label>
        {mutation.error && <p role="alert">{mutation.error.message}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={mutation.busy}>{mutation.busy ? 'Saving…' : 'Save service'}</Button>
          <Button type="button" variant="secondary" disabled={mutation.busy} onClick={onClose}>Close form</Button>
        </div>
      </form>
    </Card>
  );
}

function ServiceManager({ accountType }) {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  const loadProfile = useCallback(async () => {
    try {
      if (accountType === 'WORKER') return (await workerService.getMyProfile()).serviceCategories;
      const business = (await businessService.getMyBusinesses()).content[0];
      return business ? [business.category] : [];
    } catch (error) {
      if (error.status === 404) return [];
      throw error;
    }
  }, [accountType]);
  const profile = useCommerceResource(loadProfile);
  const load = useCallback(() => commerceService.mine(page), [page]);
  const resource = useCommerceResource(load);

  return (
    <>
      <ResourceFeedback resource={profile} />
      {profile.data?.length === 0 && (
        <Card className="p-5 space-y-3">
          <p>Set up your provider profile and service category before adding services.</p>
          <Link className="btn-primary inline-flex min-h-11 items-center"
            to={accountType === 'WORKER' ? '/worker-profile' : '/business-profile'}>Manage profile</Link>
        </Card>
      )}
      {!!profile.data?.length && (
        <>
          <ResourceFeedback resource={resource} />
          {saved && <p role="status">Service saved.</p>}
          {editing && (
            <ServiceForm key={editing.id || 'new'} offering={editing} categories={profile.data} onClose={() => setEditing(null)}
              onSaved={() => { setEditing(null); setSaved(true); setPage(0); resource.retry(); }} />
          )}
          {resource.data && (
            <>
              {!editing && <Button type="button" onClick={() => { setSaved(false); setEditing({}); }}>Add service</Button>}
              {resource.data.content.map((offering) => (
                <Card key={offering.id} className="p-5 space-y-2 break-words">
                  <h2 className="font-semibold">{offering.name}</h2>
                  <OfferingDetails offering={offering} />
                  <p className="text-sm">{offering.active ? 'Visible on your profile' : 'Hidden from your profile'}</p>
                  {!editing && <Button type="button" variant="secondary" onClick={() => { setSaved(false); setEditing(offering); }}>Edit {offering.name}</Button>}
                </Card>
              ))}
              <Pagination page={page} totalPages={resource.data.totalPages} setPage={setPage} />
            </>
          )}
        </>
      )}
    </>
  );
}

export default function ManageServices() {
  const { user } = useAuth();
  return (
    <CommercePage title="Manage services">
      {isProvider(user) ? (
        <>
          <Link to="/bookings/incoming" className="btn-secondary inline-flex min-h-11 items-center">Incoming bookings</Link>
          <ServiceManager accountType={user.accountType} />
        </>
      ) : <p>Business and worker accounts can manage service listings here.</p>}
    </CommercePage>
  );
}
