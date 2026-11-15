import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Avatar } from './ui';
import { Button } from './index';
import { useAuth } from '../contexts/AuthContext';
import '../styles/profile-image.css';
import { userService } from '../services/api';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export default function ProfileImageEditor() {
  const { user, updateUser, refreshUser } = useAuth();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  function select(event) {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    setNotice(null);
    if (!TYPES.includes(chosen.type)) { setNotice({ error: true, text: 'Choose a JPEG, PNG or WebP image.' }); return; }
    if (chosen.size > 5 * 1024 * 1024) { setNotice({ error: true, text: 'Profile pictures must be 5 MB or smaller.' }); return; }
    setPreviewFailed(false);
    setFile(chosen);
  }
  async function change(remove = false) {
    setBusy(true); setNotice(null);
    try {
      const profile = remove ? await userService.removeProfileImage() : await userService.uploadProfileImage(file);
      // The mutation returns the committed profile; update all visible avatars immediately.
      updateUser(profile);
      setFile(null);
      try { await refreshUser(); }
      catch {
        setNotice({ error: true, text: 'Picture saved, but the account refresh failed. Refresh the page to check your session.' });
        return;
      }
      setNotice({ text: remove ? 'Profile picture removed.' : 'Profile picture saved.' });
    } catch (error) {
      setNotice({ error: true, text: error.data?.message || error.message || 'Unable to update your profile picture.' });
    } finally { setBusy(false); }
  }
  return <section className="profile-picture-editor" aria-label="Profile picture" aria-busy={busy}>
    <div className="relative inline-block">
      {preview ? <img src={preview} alt="Selected profile picture preview" className="w-24 h-24 rounded-full object-cover border border-neutral-300" onError={() => { setPreviewFailed(true); setNotice({ error: true, text: 'This image cannot be previewed. Choose another image.' }); }} />
        : <Avatar name={name} src={user?.profileImageUrl} alt={`${name || 'Your'} profile picture`} className="!w-24 !h-24 !text-3xl !rounded-full overflow-hidden" />}
      <button type="button" className="profile-picture-camera icon-button absolute -bottom-1 -right-2" disabled={busy} aria-label="Choose profile picture" onClick={() => input.current?.click()}><Camera size={20} aria-hidden="true" /></button>
    </div>
    <label htmlFor="profile-picture-file" className="sr-only">Choose a profile picture file</label>
    <input ref={input} id="profile-picture-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={select} disabled={busy} className="sr-only" aria-describedby="profile-picture-help" />
    <p id="profile-picture-help" className="text-xs text-neutral-600 mt-3">JPEG, PNG or WebP · up to 5 MB.<br />Worker account photos also appear on public worker profiles.</p>
    {file && <div className="flex flex-wrap justify-center gap-2 mt-4">
      <Button type="button" disabled={busy || previewFailed} onClick={() => change()}>{busy ? 'Saving picture…' : 'Save picture'}</Button>
      <Button type="button" variant="secondary" disabled={busy} onClick={() => { setFile(null); setNotice(null); setPreviewFailed(false); }}>Cancel picture</Button>
    </div>}
    {user?.profileImageUrl && !file && <Button type="button" variant="secondary" className="mt-4" disabled={busy} onClick={() => change(true)}><Trash2 size={16} aria-hidden="true" />{busy ? 'Removing picture…' : 'Remove picture'}</Button>}
    {busy && <p role="status" className="text-sm mt-3">Updating your profile picture…</p>}
    {notice && <p role={notice.error ? 'alert' : 'status'} className={`text-sm mt-3 ${notice.error ? 'text-red-700' : 'text-kasi-green'}`}>{notice.text}</p>}
  </section>;
}
