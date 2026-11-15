import { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileImageEditor from './ProfileImageEditor';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';

vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../services/api', () => ({ userService: { uploadProfileImage: vi.fn(), removeProfileImage: vi.fn() } }));
const initial = { id: 'member', firstName: 'Local', lastName: 'Member', accountType: 'RESIDENT' };
const photo = { ...initial, profileImageUrl: 'https://images.example.test/avatar.png' };
const updateUser = vi.fn(), refreshUser = vi.fn();
function setup(user = initial) {
  function Wrapper() {
    const [current, setCurrent] = useState(user);
    useAuth.mockReturnValue({ user: current, updateUser: (next) => { updateUser(next); setCurrent(next); }, refreshUser });
    return <><ProfileImageEditor /><Avatar name="Header member" src={current.profileImageUrl} alt="Header avatar" /></>;
  }
  return render(<Wrapper />);
}
const file = () => new File(['test-image'], 'avatar.png', { type: 'image/png' });
async function select(user) { await user.upload(screen.getByLabelText('Choose a profile picture file'), file()); }

beforeEach(() => {
  vi.resetAllMocks();
  URL.createObjectURL = vi.fn(() => 'blob:local-avatar-preview');
  URL.revokeObjectURL = vi.fn();
  refreshUser.mockResolvedValue(photo);
  userService.uploadProfileImage.mockResolvedValue(photo);
  userService.removeProfileImage.mockResolvedValue(initial);
});
describe('Profile picture management', () => {
  it('provides initials, accessible selection and supported type guidance', () => {
    setup();expect(screen.getByRole('img', { name: 'Local Member profile picture' })).toHaveTextContent('LM');
    expect(screen.getByRole('button', { name: 'Choose profile picture' })).toBeEnabled();
    expect(screen.getByLabelText('Choose a profile picture file')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
    expect(screen.getByText(/up to 5 MB/)).toBeVisible();
  });
  it('previews locally without uploading, and cancel restores the saved picture and revokes the blob', async () => {
    const user = userEvent.setup(); setup(photo);await select(user);
    expect(screen.getByRole('img', { name: 'Selected profile picture preview' })).toHaveAttribute('src','blob:local-avatar-preview');
    expect(userService.uploadProfileImage).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel picture' }));
    expect(screen.queryByAltText('Selected profile picture preview')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Local Member profile picture' }).querySelector('img')).toHaveAttribute('src', photo.profileImageUrl);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-avatar-preview');
  });
  it.each(['RESIDENT','BUSINESS','WORKER'])('uploads for %s, updates all avatars and refreshes the account', async accountType => {
    const user = userEvent.setup();setup({ ...initial, accountType });await select(user);
    await user.click(screen.getByRole('button', { name: 'Save picture' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Profile picture saved.');
    expect(userService.uploadProfileImage).toHaveBeenCalledWith(expect.any(File));
    expect(updateUser).toHaveBeenCalledWith(photo);expect(refreshUser).toHaveBeenCalledOnce();
    expect(screen.getByRole('img', { name: 'Header avatar' }).querySelector('img')).toHaveAttribute('src', photo.profileImageUrl);
  });
  it('preserves saved data and retryable preview on upload failure', async () => {
    userService.uploadProfileImage.mockRejectedValue(new Error('Storage unavailable'));
    const user=userEvent.setup();setup(photo);await select(user);await user.click(screen.getByRole('button',{name:'Save picture'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Storage unavailable');
    expect(updateUser).not.toHaveBeenCalled();expect(refreshUser).not.toHaveBeenCalled();
    expect(screen.getByAltText('Selected profile picture preview')).toBeVisible();
  });
  it('removes a picture and updates the shared fallback',async()=>{
    const user=userEvent.setup();setup(photo);await user.click(screen.getByRole('button',{name:'Remove picture'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Profile picture removed.');
    expect(updateUser).toHaveBeenCalledWith(initial);expect(refreshUser).toHaveBeenCalledOnce();
    expect(screen.getByRole('img',{name:'Header avatar'})).toHaveTextContent('HM');
  });
  it('keeps the existing picture when removal fails',async()=>{
    userService.removeProfileImage.mockRejectedValue(new Error('Try again later'));
    const user=userEvent.setup();setup(photo);await user.click(screen.getByRole('button',{name:'Remove picture'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Try again later');expect(updateUser).not.toHaveBeenCalled();
    expect(screen.getByRole('img',{name:'Header avatar'}).querySelector('img')).toHaveAttribute('src',photo.profileImageUrl);
  });
  it('rejects unsupported and oversized selections without sending them',async()=>{
    const user=userEvent.setup({applyAccept:false});setup();
    await user.upload(screen.getByLabelText('Choose a profile picture file'),new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a JPEG, PNG or WebP image.');
    await user.upload(screen.getByLabelText('Choose a profile picture file'),new File([new Uint8Array(5*1024*1024+1)],'large.png',{type:'image/png'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('5 MB or smaller');expect(userService.uploadProfileImage).not.toHaveBeenCalled();
  });
  it('disables repeated saves while uploading and provides loading feedback',async()=>{
    let release;userService.uploadProfileImage.mockReturnValue(new Promise(resolve=>{release=resolve;}));
    const user=userEvent.setup();setup();await select(user);await user.click(screen.getByRole('button',{name:'Save picture'}));
    expect(screen.getByRole('status')).toHaveTextContent('Updating your profile picture');
    expect(screen.getByRole('button',{name:'Saving picture…'})).toBeDisabled();expect(screen.getByRole('button',{name:'Cancel picture'})).toBeDisabled();
    await act(async()=>release(photo));await screen.findByText('Profile picture saved.');
  });
  it('blocks saving an undecodable preview and releases temporary URLs on unmount',async()=>{
    const user=userEvent.setup();const view=setup();await select(user);
    fireEvent.error(screen.getByAltText('Selected profile picture preview'));
    expect(screen.getByRole('alert')).toHaveTextContent('cannot be previewed');expect(screen.getByRole('button',{name:'Save picture'})).toBeDisabled();
    view.unmount();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-avatar-preview');
  });
  it('retains the committed photo and reports a separate refresh failure',async()=>{
    refreshUser.mockRejectedValue(new Error('offline'));const user=userEvent.setup();setup();await select(user);await user.click(screen.getByRole('button',{name:'Save picture'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Picture saved, but the account refresh failed');expect(updateUser).toHaveBeenCalledWith(photo);
  });
  it('falls back on broken remote images and accepts a later replacement',()=>{
    const view=render(<Avatar name="Test Member" src="https://images.example.test/broken.png" alt="Account picture"/>);
    fireEvent.error(screen.getByRole('img',{name:'Account picture'}).querySelector('img'));
    expect(screen.getByRole('img',{name:'Account picture'})).toHaveTextContent('TM');
    view.rerender(<Avatar name="Test Member" src={photo.profileImageUrl} alt="Account picture"/>);
    expect(screen.getByRole('img',{name:'Account picture'}).querySelector('img')).toHaveAttribute('src',photo.profileImageUrl);
  });
});
