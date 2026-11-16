import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { businessService } from '../services/api';
import { validCoordinates } from '../models/mapLocation';
import { Button, Card } from './index';
import '../styles/business-location.css';
const Picker = lazy(() => import('./BusinessLocationPicker'));
class PickerBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">The map picker could not open. You can still enter coordinates below.</p> : this.props.children; }
}
const draftFrom = location => ({ latitude: location.latitude == null ? '' : String(location.latitude), longitude: location.longitude == null ? '' : String(location.longitude), locationPublic: location.locationPublic === true });
const empty = { latitude: null, longitude: null, locationPublic: false };
export default function BusinessLocationEditor({ businessId }) {
  const [saved, setSaved] = useState(null), [draft, setDraft] = useState(draftFrom(empty));
  const [editing, setEditing] = useState(false), [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const action = useRef(null), heading = useRef(null), returnFocus = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);setNotice(null);
    try { setSaved(await businessService.getLocation(businessId)); }
    catch (error) { setNotice({ error: true, text: error.data?.message || error.message || 'Unable to load your business location.' }); }
    finally { setLoading(false); }
  }, [businessId]);
  // Fetch the private draft only when the owner chooses to manage it.
  useEffect(() => { setSaved(null);setEditing(false);setNotice(null); }, [businessId]);
  const open = async () => {
    let location = saved;
    if (!location) {
      setLoading(true);setNotice(null);
      try { location = await businessService.getLocation(businessId);setSaved(location); }
      catch (error) { setNotice({ error: true, text: error.data?.message || error.message || 'Unable to load your business location.' });return; }
      finally { setLoading(false); }
    }
    setDraft(draftFrom(location));setNotice(null);setEditing(true);
  };
  useEffect(() => { if (editing) heading.current?.focus();else if (returnFocus.current) { action.current?.focus();returnFocus.current = false; } }, [editing]);
  const cancel = () => { returnFocus.current = true;setEditing(false);setNotice(null); };
  const latitude = draft.latitude.trim() === '' ? null : Number(draft.latitude), longitude = draft.longitude.trim() === '' ? null : Number(draft.longitude);
  const valid = validCoordinates(latitude, longitude);
  const position = valid ? [latitude, longitude] : null;
  async function save(event) {
    event.preventDefault();if (busy) return;
    if (!valid && !(latitude === null && longitude === null && !draft.locationPublic)) { setNotice({ error: true, text: 'Enter both valid coordinates: latitude -90 to 90 and longitude -180 to 180.' });return; }
    setBusy(true);setNotice(null);
    try {
      const updated = await businessService.saveLocation(businessId, { latitude, longitude, locationPublic: draft.locationPublic });
      setSaved(updated);returnFocus.current = true;setEditing(false);setNotice({ text: updated.locationPublic ? 'Business location published. Customers can see this pin.' : 'Business location saved privately. It is hidden from the marketplace map.' });action.current?.focus();
    } catch (error) { setNotice({ error: true, text: error.data?.message || error.message || 'Unable to save your business location.' }); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (busy) return;setBusy(true);setNotice(null);
    try { setSaved(await businessService.removeLocation(businessId));returnFocus.current = true;setEditing(false);setNotice({ text: 'Business location removed. Your listing remains available in List View.' });action.current?.focus(); }
    catch (error) { setNotice({ error: true, text: error.data?.message || error.message || 'Unable to remove your business location.' }); }
    finally { setBusy(false); }
  }
  return <Card className="business-location-editor p-6 md:col-span-2" aria-busy={busy || loading}>
    <h3 className="font-bold text-xl mb-2">Business map location</h3>
    <p className="text-sm mb-3">Publishing a pin makes your precise location visible to customers. For a home-based business, choose a public-facing business location or keep the exact location private.</p>
    {!editing && <>
      {saved && <p className="text-sm mb-3">{saved.locationPublic ? 'Published on the marketplace map.' : saved.latitude != null ? 'Private draft — not visible to customers.' : 'No map location saved.'}</p>}
      <button ref={action} type="button" className="button button-secondary location-action" disabled={busy || loading} onClick={open}>{saved?.latitude != null ? 'Manage business location' : 'Set business location'}</button>
    </>}
    {loading && <p role="status" className="mt-3">Loading business location…</p>}
    {notice && <p className="mt-3 text-sm" role={notice.error ? 'alert' : 'status'}>{notice.text}</p>}
    {notice?.error && !editing && !saved && <Button type="button" variant="secondary" onClick={load} disabled={loading}>Retry location</Button>}
    {editing && <form onSubmit={save} className="mt-4" aria-label="Business location editor">
      <h4 ref={heading} tabIndex={-1} className="font-bold mb-3">Choose your business pin</h4>
      <PickerBoundary><Suspense fallback={<p role="status">Opening location picker…</p>}><Picker position={position} disabled={busy} onChange={(lat, lng) => setDraft(current => ({ ...current, latitude: String(Math.round(lat * 1e6) / 1e6), longitude: String(Math.round(lng * 1e6) / 1e6) }))} /></Suspense></PickerBoundary>
      <fieldset disabled={busy} className="location-coordinate-fields mt-4">
        <legend className="sr-only">Business coordinates and publication</legend>
        <label>Latitude<input className="input-field" type="number" step="any" min="-90" max="90" value={draft.latitude} onChange={event => setDraft(current => ({ ...current, latitude: event.target.value }))} /></label>
        <label>Longitude<input className="input-field" type="number" step="any" min="-180" max="180" value={draft.longitude} onChange={event => setDraft(current => ({ ...current, longitude: event.target.value }))} /></label>
        <label className="location-consent"><input type="checkbox" checked={draft.locationPublic} onChange={event => setDraft(current => ({ ...current, locationPublic: event.target.checked }))} />Publish this precise business location to customers</label>
      </fieldset>
      <div className="flex flex-wrap gap-3 mt-4"><Button type="submit" disabled={busy}>{busy ? 'Saving location…' : 'Save location'}</Button><Button type="button" variant="secondary" onClick={cancel} disabled={busy}>Cancel location</Button>
        {saved?.latitude != null && <Button type="button" variant="secondary" onClick={remove} disabled={busy}>Remove location</Button>}</div>
      {busy && <p role="status" className="mt-3">Updating business location…</p>}
    </form>}
  </Card>;
}
