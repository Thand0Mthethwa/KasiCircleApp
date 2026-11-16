import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BusinessLocationEditor from './BusinessLocationEditor';
import { businessService } from '../services/api';
import { requestDeviceLocation } from '../services/deviceLocation';
vi.mock('../services/api',()=>({businessService:{getLocation:vi.fn(),saveLocation:vi.fn(),removeLocation:vi.fn()}}));
vi.mock('../services/deviceLocation',()=>({requestDeviceLocation:vi.fn()}));
vi.mock('./BusinessLocationPicker',()=>({default:({onChange,disabled,area})=><div aria-label="Picker fixture">{area&&<p>Area: {area.label}</p>}<button type="button" disabled={disabled} onClick={()=>onChange(-25.72,28.24)}>Place test pin</button><button type="button" disabled={disabled} onClick={()=>onChange(-25.73,28.25)}>Move test pin</button></div>}));
const empty={latitude:null,longitude:null,locationPublic:false},draft={latitude:-25.72,longitude:28.24,locationPublic:false};
beforeEach(()=>{vi.resetAllMocks();businessService.getLocation.mockResolvedValue(empty);businessService.saveLocation.mockImplementation(async(_id,value)=>value);businessService.removeLocation.mockResolvedValue(empty);requestDeviceLocation.mockResolvedValue({...draft,accuracy:10,imprecise:false});});
async function open(user){await user.click(screen.getByRole('button',{name:/Set business location|Manage business location/}));await screen.findByRole('heading',{name:/Step 1 of 5/});}
async function map(user){await user.click(screen.getByRole('button',{name:'Choose on the map'}));await screen.findByRole('button',{name:'Place test pin'});}
async function review(user){await user.click(screen.getByRole('button',{name:'Confirm this location'}));await screen.findByRole('heading',{name:/Step 3 of 5/});await user.click(screen.getByRole('button',{name:'Continue to visibility'}));}
async function save(user){await user.click(screen.getByRole('button',{name:'Continue to save'}));await user.click(screen.getByRole('button',{name:'Save location',exact:true}));}
describe('guided owner location setup',()=>{
  it('loads drafts only on action, uses plain language and hides advanced numbers initially',async()=>{
    render(<BusinessLocationEditor businessId="one"/>);expect(businessService.getLocation).not.toHaveBeenCalled();expect(screen.getByRole('heading',{name:'Where can customers find your business?'})).toBeVisible();
    const user=userEvent.setup();await open(user);expect(requestDeviceLocation).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Search places'})).toBeDisabled();
    await map(user);expect(screen.getByText('Advanced: Enter GPS coordinates')).toBeVisible();expect(screen.getByLabelText('Latitude')).not.toBeVisible();expect(screen.queryByRole('button',{name:'Save location',exact:true})).not.toBeInTheDocument();
  });
  it('confirms a map pin, reviews, chooses privacy and saves only at the final step',async()=>{
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await map(user);await user.click(screen.getByRole('button',{name:'Place test pin'}));
    expect(businessService.saveLocation).not.toHaveBeenCalled();await review(user);expect(screen.getByRole('checkbox',{name:'Show this pin to customers'})).not.toBeChecked();
    await save(user);expect(await screen.findByRole('status')).toHaveTextContent('saved privately');expect(businessService.saveLocation).toHaveBeenCalledWith('one',draft);expect(screen.getByRole('button',{name:'Manage business location'})).toHaveFocus();
  });
  it('supports Back and Cancel without changing a saved private pin',async()=>{
    businessService.getLocation.mockResolvedValue(draft);const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await map(user);await user.click(screen.getByRole('button',{name:'Move test pin'}));await review(user);
    await user.click(screen.getByRole('button',{name:'Back',exact:true}));expect(screen.getByRole('heading',{name:/Step 3 of 5/})).toHaveFocus();
    await user.click(screen.getByRole('button',{name:'Cancel location'}));expect(businessService.saveLocation).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Manage business location'})).toHaveFocus();
    await open(user);expect(businessService.getLocation).toHaveBeenCalledTimes(2);
  });
  it('retains published consent but requires another explicit confirmation for a changed public pin',async()=>{
    businessService.getLocation.mockResolvedValue({...draft,locationPublic:true});const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await map(user);await user.click(screen.getByRole('button',{name:'Move test pin'}));await review(user);
    expect(screen.getByRole('checkbox',{name:'Show this pin to customers'})).toBeChecked();await user.click(screen.getByRole('button',{name:'Continue to save'}));expect(await screen.findByRole('alert')).toHaveTextContent('changed pin');expect(businessService.saveLocation).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox',{name:'I confirm customers may see this changed location'}));await save(user);expect(await screen.findByRole('status')).toHaveTextContent('published');expect(businessService.saveLocation).toHaveBeenCalledWith('one',{latitude:-25.73,longitude:28.25,locationPublic:true});
  });
  it('allows hiding a published pin without losing its saved position',async()=>{
    businessService.getLocation.mockResolvedValue({...draft,locationPublic:true});const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await map(user);await review(user);await user.click(screen.getByRole('checkbox',{name:'Show this pin to customers'}));await save(user);
    expect(await screen.findByRole('status')).toHaveTextContent('hidden from the marketplace');expect(businessService.saveLocation).toHaveBeenCalledWith('one',draft);
  });
  it('keeps advanced keyboard entry and validates pairs before confirmation',async()=>{
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await map(user);await user.click(screen.getByRole('button',{name:'Confirm this location'}));expect(await screen.findByRole('alert')).toHaveTextContent('Mark a spot');
    await user.click(screen.getByText('Advanced: Enter GPS coordinates'));await user.type(screen.getByLabelText('Latitude'),'-25.72');await user.type(screen.getByLabelText('Longitude'),'28.24');await review(user);await save(user);await screen.findByText(/saved privately/);
  });
  it('explains device permission before asking and requires a pin review even on success',async()=>{
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await user.click(screen.getByRole('button',{name:'Use my current location'}));
    expect(screen.getByText(/This works best when you are at your business/)).toBeVisible();expect(requestDeviceLocation).not.toHaveBeenCalled();await user.click(screen.getByRole('button',{name:'Continue and ask permission'}));
    expect(await screen.findByRole('heading',{name:/Step 2 of 5/})).toHaveFocus();expect(screen.getByText(/suggestion from your device/)).toBeVisible();expect(businessService.saveLocation).not.toHaveBeenCalled();await review(user);await save(user);await screen.findByText(/saved privately/);
  });
  it.each(['Location permission was not given.','Finding your location took too long.','Your device could not find your location.'])('handles device failure: %s',async message=>{
    requestDeviceLocation.mockRejectedValue(new Error(message));const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await user.click(screen.getByRole('button',{name:'Use my current location'}));await user.click(screen.getByRole('button',{name:'Continue and ask permission'}));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);expect(businessService.saveLocation).not.toHaveBeenCalled();await user.click(screen.getByRole('button',{name:'Choose another method'}));await map(user);
  });
  it('warns on an imprecise result and ignores a late result after Cancel',async()=>{
    requestDeviceLocation.mockResolvedValueOnce({...draft,accuracy:700,imprecise:true});const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);await user.click(screen.getByRole('button',{name:'Use my current location'}));await user.click(screen.getByRole('button',{name:'Continue and ask permission'}));expect(await screen.findByText(/700 metres/)).toBeVisible();await user.click(screen.getByRole('button',{name:'Cancel location'}));
    let resolve;requestDeviceLocation.mockReturnValueOnce(new Promise(done=>{resolve=done;}));await open(user);await user.click(screen.getByRole('button',{name:'Use my current location'}));await user.click(screen.getByRole('button',{name:'Continue and ask permission'}));await user.click(screen.getByRole('button',{name:'Cancel location'}));resolve({...draft,accuracy:5,imprecise:false});await waitFor(()=>expect(screen.queryByRole('form')).not.toBeInTheDocument());expect(businessService.saveLocation).not.toHaveBeenCalled();
  });
  it('retries load errors, preserves edits on save errors and clears only on explicit removal',async()=>{
    businessService.getLocation.mockRejectedValueOnce(new Error('Load failed')).mockResolvedValue(draft);businessService.saveLocation.mockRejectedValue(new Error('Save failed'));
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await user.click(screen.getByRole('button',{name:'Set business location'}));expect(await screen.findByRole('alert')).toHaveTextContent('Load failed');await user.click(screen.getByRole('button',{name:'Retry location'}));await screen.findByRole('heading',{name:/Step 1/});await map(user);await review(user);await save(user);expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');expect(screen.getByRole('heading',{name:/Step 5/})).toBeVisible();
    await user.click(screen.getByRole('button',{name:'Remove location'}));expect(await screen.findByRole('status')).toHaveTextContent('listing remains available');expect(businessService.removeLocation).toHaveBeenCalledWith('one');
  });
  it('never saves an early form submission and disables controls during final persistence',async()=>{
    const user=userEvent.setup();render(<BusinessLocationEditor businessId="one"/>);await open(user);fireEvent.submit(screen.getByRole('form'));expect(businessService.saveLocation).not.toHaveBeenCalled();await map(user);await user.click(screen.getByRole('button',{name:'Place test pin'}));await review(user);await user.click(screen.getByRole('button',{name:'Continue to save'}));
    let resolve;businessService.saveLocation.mockReturnValueOnce(new Promise(done=>{resolve=done;}));await user.click(screen.getByRole('button',{name:'Save location',exact:true}));expect(screen.getByRole('button',{name:'Saving location…'})).toBeDisabled();expect(screen.getByRole('button',{name:'Cancel location'})).toBeDisabled();resolve(draft);await screen.findByText(/saved privately/);
  });
});
