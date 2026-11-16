import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BusinessLocationEditor from './BusinessLocationEditor';
import { businessService } from '../services/api';
vi.mock('../services/api', () => ({ businessService: { getLocation: vi.fn(), saveLocation: vi.fn(), removeLocation: vi.fn() } }));
vi.mock('./BusinessLocationPicker', () => ({ default: ({ onChange, disabled }) => <div aria-label="Picker fixture"><button type="button" disabled={disabled} onClick={() => onChange(-25.72,28.24)}>Place test pin</button><button type="button" disabled={disabled} onClick={() => onChange(-25.73,28.25)}>Move test pin</button></div> }));
const empty = { latitude: null, longitude: null, locationPublic: false };
const draft = { latitude: -25.72, longitude: 28.24, locationPublic: false };
beforeEach(() => { vi.resetAllMocks();businessService.getLocation.mockResolvedValue(empty);businessService.saveLocation.mockImplementation(async (_id,value) => value);businessService.removeLocation.mockResolvedValue(empty); });
async function open(user) { await user.click(screen.getByRole('button', { name: /Set business location|Manage business location/ }));return screen.findByRole('form', { name: 'Business location editor' }); }
describe('owner business location editor', () => {
  it('loads the private draft only on explicit owner action, shows consent guidance and starts blank', async () => {
    render(<BusinessLocationEditor businessId="one"/>);expect(businessService.getLocation).not.toHaveBeenCalled();
    expect(screen.getByText(/Publishing a pin makes your precise location visible/)).toBeVisible();
    await open(userEvent.setup());expect(businessService.getLocation).toHaveBeenCalledWith('one');
    expect(screen.getByRole('spinbutton', { name: 'Latitude' })).toHaveValue(null);expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('heading', { name: 'Choose your business pin' })).toHaveFocus();
  });
  it('selects and moves a pin without automatic publication; Cancel persists nothing and restores focus', async () => {
    const user = userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);
    await user.click(screen.getByRole('button', { name: 'Place test pin' }));expect(screen.getByLabelText('Latitude')).toHaveValue(-25.72);
    await user.click(screen.getByRole('button', { name: 'Move test pin' }));expect(screen.getByLabelText('Longitude')).toHaveValue(28.25);
    expect(screen.getByRole('checkbox')).not.toBeChecked();await user.click(screen.getByRole('button', { name: 'Cancel location' }));
    expect(businessService.saveLocation).not.toHaveBeenCalled();expect(screen.getByRole('button', { name: 'Set business location' })).toHaveFocus();
  });
  it('saves a private location and retains the last confirmed values after cancelling changes', async () => {
    const user = userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);
    await user.type(screen.getByLabelText('Latitude'), '-25.72');await user.type(screen.getByLabelText('Longitude'), '28.24');
    await user.click(screen.getByRole('button', { name: 'Save location' }));expect(await screen.findByRole('status')).toHaveTextContent('saved privately');
    expect(businessService.saveLocation).toHaveBeenCalledWith('one',draft);
    await open(user);await user.clear(screen.getByLabelText('Latitude'));await user.type(screen.getByLabelText('Latitude'), '-20');
    await user.click(screen.getByRole('button', { name: 'Cancel location' }));await open(user);expect(screen.getByLabelText('Latitude')).toHaveValue(-25.72);
  });
  it('publishes only explicit consent, and hides while retaining the owner draft', async () => {
    businessService.getLocation.mockResolvedValue(draft);
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button',{name:'Save location'}));expect(await screen.findByRole('status')).toHaveTextContent('published');
    expect(businessService.saveLocation).toHaveBeenLastCalledWith('one',{...draft,locationPublic:true});
    await open(user);await user.click(screen.getByRole('checkbox'));await user.click(screen.getByRole('button',{name:'Save location'}));
    expect(await screen.findByRole('status')).toHaveTextContent('hidden from the marketplace');expect(businessService.saveLocation).toHaveBeenLastCalledWith('one',draft);
  });
  it('removes a saved location without deleting the business listing', async () => {
    businessService.getLocation.mockResolvedValue(draft);const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);
    await user.click(screen.getByRole('button',{name:'Remove location'}));expect(await screen.findByRole('status')).toHaveTextContent('listing remains available');
    expect(businessService.removeLocation).toHaveBeenCalledWith('one');expect(screen.getByRole('button',{name:'Set business location'})).toHaveFocus();
  });
  it('reports private-draft load errors and permits retry', async () => {
    businessService.getLocation.mockRejectedValueOnce(new Error('Draft unavailable'));const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);
    await user.click(screen.getByRole('button',{name:'Set business location'}));expect(await screen.findByRole('alert')).toHaveTextContent('Draft unavailable');
    await user.click(screen.getByRole('button',{name:'Retry location'}));await waitFor(()=>expect(businessService.getLocation).toHaveBeenCalledTimes(2));await open(user);
    expect(screen.getByRole('form')).toBeVisible();
  });
  it('retains changes on save failure and the saved location on removal failure', async () => {
    businessService.getLocation.mockResolvedValue(draft);businessService.saveLocation.mockRejectedValue(new Error('Save failed'));businessService.removeLocation.mockRejectedValue(new Error('Removal failed'));
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);
    await user.click(screen.getByRole('button',{name:'Save location'}));expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');expect(screen.getByLabelText('Latitude')).toHaveValue(-25.72);
    await user.click(screen.getByRole('button',{name:'Remove location'}));expect(await screen.findByRole('alert')).toHaveTextContent('Removal failed');expect(screen.getByRole('button',{name:'Remove location'})).toBeEnabled();
  });
  it('rejects incomplete pairs and publication without a pin', async () => {
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await user.click(screen.getByRole('checkbox'));
    fireEvent.submit(screen.getByRole('form'));expect(await screen.findByRole('alert')).toHaveTextContent('Enter both valid coordinates');
    await user.type(screen.getByLabelText('Latitude'),'-25');fireEvent.submit(screen.getByRole('form'));expect(businessService.saveLocation).not.toHaveBeenCalled();
  });
  it('disables mutations and placement while saving and exposes loading feedback', async () => {
    let release;businessService.saveLocation.mockReturnValue(new Promise(resolve=>{release=resolve;}));businessService.getLocation.mockResolvedValue(draft);
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await user.click(screen.getByRole('button',{name:'Save location'}));
    expect(screen.getByRole('button',{name:'Saving location…'})).toBeDisabled();expect(screen.getByRole('button',{name:'Place test pin'})).toBeDisabled();expect(screen.getByRole('status')).toHaveTextContent('Updating business location');
    release(draft);await screen.findByText(/saved privately/);
  });
});
