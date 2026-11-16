import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { businessService } from '../services/api';
import { requestDeviceLocation } from '../services/deviceLocation';
import { validCoordinates } from '../models/mapLocation';
import { Button, Card } from './index';
import BusinessPlaceSearch from './BusinessPlaceSearch';
import '../styles/business-location.css';
const Picker = lazy(() => import('./BusinessLocationPicker'));
class PickerBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">The map could not open. You can use the Advanced section if you know the spot, or try again later.</p> : this.props.children; }
}
const empty = { latitude: null, longitude: null, locationPublic: false };
const draftFrom = location => ({ latitude: location.latitude == null ? '' : String(location.latitude), longitude: location.longitude == null ? '' : String(location.longitude), locationPublic: location.locationPublic === true });
const titles = ['Find your area', 'Mark where your business is', 'Review the location', 'Choose who can see the pin', 'Save your location'];
export default function BusinessLocationEditor({ businessId }) {
  const [saved, setSaved] = useState(null), [draft, setDraft] = useState(draftFrom(empty));
  const [editing, setEditing] = useState(false), [step, setStep] = useState(1), [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const [area, setArea] = useState(null), [confirmed, setConfirmed] = useState(''), [changedPublicConsent, setChangedPublicConsent] = useState(false);
  const [devicePrompt, setDevicePrompt] = useState(false), [locating, setLocating] = useState(false), [accuracyWarning, setAccuracyWarning] = useState('');
  const action = useRef(null), heading = useRef(null), returnFocus = useRef(false), deviceRequest = useRef(0);
  useEffect(() => { setSaved(null);setEditing(false);setNotice(null);return () => { deviceRequest.current++; }; }, [businessId]);
  useEffect(() => {
    if (editing) heading.current?.focus();
    else if (returnFocus.current) { action.current?.focus();returnFocus.current = false; }
  }, [editing, step]);
  function stopDevice() { deviceRequest.current++;setLocating(false);setDevicePrompt(false); }
  async function open() {
    setLoading(true);setNotice(null);
    try {
      // Re-read the owner's draft so another tab's saved changes are not silently replaced.
      const location = await businessService.getLocation(businessId);setSaved(location);setDraft(draftFrom(location));
      setStep(1);setArea(null);setConfirmed('');setChangedPublicConsent(false);setAccuracyWarning('');stopDevice();setEditing(true);
    } catch (error) { setNotice({ error: true, text: error.data?.message || error.message || 'Unable to load your saved location. Try again.' }); }
    finally { setLoading(false); }
  }
  function cancel() { stopDevice();returnFocus.current = true;setEditing(false);setNotice(null); }
  function go(next) { stopDevice();setNotice(null);setStep(next); }
  const latitude = draft.latitude.trim() === '' ? null : Number(draft.latitude), longitude = draft.longitude.trim() === '' ? null : Number(draft.longitude);
  const valid = validCoordinates(latitude, longitude), pointKey = valid ? `${latitude},${longitude}` : '';
  const position = valid ? [latitude, longitude] : null;
  const changed = saved?.latitude !== latitude || saved?.longitude !== longitude;
  const needsPublicConfirmation = saved?.locationPublic === true && draft.locationPublic && changed;
  function choosePoint(lat, lng) {
    setDraft(current => ({ ...current, latitude: String(Math.round(lat * 1e6) / 1e6), longitude: String(Math.round(lng * 1e6) / 1e6) }));
    setConfirmed('');setChangedPublicConsent(false);setNotice(null);
  }
  function advanced(name, value) { setDraft(current => ({ ...current, [name]: value }));setConfirmed('');setChangedPublicConsent(false);setAccuracyWarning(''); }
  function confirmPoint() {
    if (!valid) { setNotice({ error: true, text: 'Mark a spot on the map. If you use Advanced settings, enter both valid values.' });return; }
    setConfirmed(pointKey);go(3);
  }
  async function locate() {
    const request = ++deviceRequest.current;setLocating(true);setNotice(null);
    try {
      const point = await requestDeviceLocation();
      if (request !== deviceRequest.current) return;
      choosePoint(point.latitude, point.longitude);setArea(null);
      setAccuracyWarning(point.imprecise ? (Number.isFinite(point.accuracy) && point.accuracy >= 0
        ? `Your device may be about ${Math.ceil(point.accuracy)} metres away from the right spot. Move the pin to your business before confirming.`
        : 'Your device could not tell how accurate this spot is. Check and move the pin before confirming.')
        : 'This is a suggestion from your device. Check that the pin is at your business before confirming.');
      setDevicePrompt(false);setStep(2);
    } catch (error) { if (request === deviceRequest.current) setNotice({ error: true, text: error.message }); }
    finally { if (request === deviceRequest.current) setLocating(false); }
  }
  async function save(event) {
    event.preventDefault();if (busy || step !== 5) return;
    if (!valid || confirmed !== pointKey || (needsPublicConfirmation && !changedPublicConsent)) {
      setNotice({ error: true, text: 'Please review and confirm the pin and who can see it before saving.' });return;
    }
    setBusy(true);setNotice(null);
    try {
      const updated = await businessService.saveLocation(businessId, { latitude, longitude, locationPublic: draft.locationPublic });
      setSaved(updated);returnFocus.current = true;setEditing(false);
      setNotice({ text: updated.locationPublic ? 'Business location published. Customers can see this pin.' : 'Business location saved privately. It is hidden from the marketplace map.' });
    } catch (error) { setNotice({ error: true, text: error.data?.message || error.message || 'Unable to save your location. Your saved pin has not changed.' }); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (busy) return;stopDevice();setBusy(true);setNotice(null);
    try { setSaved(await businessService.removeLocation(businessId));returnFocus.current = true;setEditing(false);setNotice({ text: 'Business location removed. Your listing remains available in List View.' }); }
    catch (error) { setNotice({ error: true, text: error.data?.message || error.message || 'Unable to remove your saved pin. Please try again.' }); }
    finally { setBusy(false); }
  }
  const picker = readOnly => <PickerBoundary><Suspense fallback={<p role="status">Opening the map…</p>}><Picker position={position} area={area} disabled={busy || readOnly} onChange={choosePoint} /></Suspense></PickerBoundary>;
  return <Card className="business-location-editor p-6 md:col-span-2" aria-busy={busy || loading || locating}>
    <h3 className="location-main-heading">Where can customers find your business?</h3>
    <p>Choose your business location using the map, your current location or a nearby landmark. You don't need to know GPS coordinates.</p>
    {!editing && <div className="location-saved-summary">
      {saved && <p className="location-state">{saved.locationPublic ? 'Published location — customers can see your pin.' : saved.latitude != null ? 'Draft location — only you can see it.' : 'No location saved.'}</p>}
      <button ref={action} type="button" className="location-action" disabled={busy || loading} onClick={open}>{saved?.latitude != null ? 'Manage business location' : 'Set business location'}</button>
    </div>}
    {loading && <p role="status">Loading your saved location…</p>}
    {notice && <p className="location-notice" role={notice.error ? 'alert' : 'status'}>{notice.text}</p>}
    {notice?.error && !editing && <Button type="button" variant="secondary" onClick={open} disabled={loading || busy}>Retry location</Button>}
    {editing && <form onSubmit={save} noValidate aria-label="Business location editor" className="location-guided-flow">
      <ol className="location-step-list" aria-label="Location setup progress">{titles.map((title,index) => <li key={title} aria-current={step === index + 1 ? 'step' : undefined}><span>{index+1}</span><span>{title}</span></li>)}</ol>
      <h4 ref={heading} tabIndex={-1}>Step {step} of 5: {titles[step-1]}</h4>
      {step === 1 && <>
        <BusinessPlaceSearch disabled={busy || locating} onSelect={place => { stopDevice();setArea(place);setDraft(current => ({ ...current, latitude: '', longitude: '' }));setConfirmed('');setChangedPublicConsent(false);setAccuracyWarning('');setNotice(null);setStep(2); }} />
        <div className="location-methods">
          <Button type="button" variant="secondary" disabled={busy || locating} aria-expanded={devicePrompt} onClick={() => { setDevicePrompt(true);setNotice(null); }}>Use my current location</Button>
          <Button type="button" disabled={busy || locating} onClick={() => { setArea(null);go(2); }}>Choose on the map</Button>
          {valid && <Button type="button" variant="secondary" disabled={busy || locating} onClick={() => go(2)}>Review my saved pin</Button>}
        </div>
        {devicePrompt && <div className="location-device-explanation" role="group" aria-label="Current location permission">
          <p>This works best when you are at your business. Your browser will ask whether you want to share your location. Nothing is saved or published yet.</p>
          <Button type="button" disabled={busy || locating} onClick={locate}>{locating ? 'Finding your location…' : 'Continue and ask permission'}</Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={stopDevice}>Choose another method</Button>
        </div>}
        {locating && <p role="status">Finding your location. You can cancel or choose another method.</p>}
      </>}
      {step === 2 && <>
        {area && <p className="location-area-note">Near {area.label}. Mark the exact spot where customers should go.</p>}
        {accuracyWarning && <p role="status" className="location-device-warning">{accuracyWarning}</p>}
        {picker(false)}
        <details className="location-advanced"><summary>Advanced: Enter GPS coordinates</summary><p>Latitude must be between -90 and 90. Longitude must be between -180 and 180. Enter both values.</p>
          <fieldset disabled={busy} className="location-coordinate-fields"><legend className="sr-only">Advanced coordinates</legend>
            <label>Latitude<input className="input-field" type="number" step="any" min="-90" max="90" value={draft.latitude} onChange={event => advanced('latitude',event.target.value)} /></label>
            <label>Longitude<input className="input-field" type="number" step="any" min="-180" max="180" value={draft.longitude} onChange={event => advanced('longitude',event.target.value)} /></label>
          </fieldset>
        </details>
        <Button type="button" disabled={busy} onClick={confirmPoint}>Confirm this location</Button>
      </>}
      {step === 3 && <><p>This is your draft pin. Check that customers would arrive at the right place. Nothing has been saved yet.</p>{picker(true)}
        <div className="location-flow-actions"><Button type="button" variant="secondary" onClick={() => go(2)}>Move the pin</Button><Button type="button" onClick={() => go(4)}>Continue to visibility</Button></div></>}
      {step === 4 && <>
        <label className="location-consent"><input type="checkbox" disabled={busy} checked={draft.locationPublic} onChange={event => { setDraft(current => ({ ...current, locationPublic: event.target.checked }));setChangedPublicConsent(false); }} />Show this pin to customers</label>
        <p>If you turn this on, customers can see this exact spot on the map.</p>
        <p>For a home-based business, choose a public-facing business location or keep the pin private.</p>
        {needsPublicConfirmation && <label className="location-consent location-public-replacement"><input type="checkbox" checked={changedPublicConsent} onChange={event => setChangedPublicConsent(event.target.checked)} />I confirm customers may see this changed location</label>}
        <Button type="button" onClick={() => { if (needsPublicConfirmation && !changedPublicConsent) { setNotice({ error: true, text: 'Confirm that customers may see the changed pin, or turn off sharing.' });return; }go(5); }}>Continue to save</Button>
      </>}
      {step === 5 && <div className="location-final-review"><p className="location-state">{draft.locationPublic ? 'Ready to publish — customers will see this exact spot.' : 'Ready to save a private draft — customers will not see this pin.'}</p>
        <p>Your saved location stays unchanged until you choose Save.</p><Button type="submit" disabled={busy}>{busy ? 'Saving location…' : 'Save location'}</Button></div>}
      <div className="location-flow-actions location-secondary-actions">
        {step > 1 && <Button type="button" variant="secondary" disabled={busy} onClick={() => go(step-1)}>Back</Button>}
        <Button type="button" variant="secondary" disabled={busy} onClick={cancel}>Cancel location</Button>
        {saved?.latitude != null && <Button type="button" variant="secondary" disabled={busy} onClick={remove}>Remove location</Button>}
      </div>
      {busy && <p role="status">Updating your saved location…</p>}
    </form>}
  </Card>;
}
