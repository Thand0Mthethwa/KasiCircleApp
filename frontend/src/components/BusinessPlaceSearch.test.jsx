import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import BusinessPlaceSearch from './BusinessPlaceSearch';
import { placeSearchStatus, searchPlaces } from '../services/placeSearch';
vi.mock('../services/placeSearch',()=>({placeSearchStatus:vi.fn(),searchPlaces:vi.fn()}));
beforeEach(()=>{vi.resetAllMocks();placeSearchStatus.mockResolvedValue(true);});
it('searches only on explicit submission and selects an approximate area, not a saved pin',async()=>{
  searchPlaces.mockResolvedValue([{key:'one',label:'Shopping centre, Soweto',latitude:-26,longitude:28}]);const onSelect=vi.fn();const user=userEvent.setup();render(<BusinessPlaceSearch onSelect={onSelect}/>);
  await user.type(screen.getByRole('searchbox'),'Shopping centre');expect(searchPlaces).not.toHaveBeenCalled();await user.keyboard('{Enter}');await user.click(await screen.findByRole('button',{name:'Shopping centre, Soweto'}));
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({latitude:-26,longitude:28}));expect(screen.getByText(/not your confirmed business pin/)).toBeVisible();expect(screen.getByRole('link',{name:'Geoapify'})).toBeVisible();
});
it('accepts Daveyton, edits and deletion even without a configured provider',async()=>{
  placeSearchStatus.mockResolvedValue(false);const user=userEvent.setup();render(<BusinessPlaceSearch onSelect={vi.fn()}/>);
  const input=screen.getByRole('searchbox');await user.type(input,'Daveyton');expect(input).toHaveValue('Daveyton');
  await user.keyboard('{Backspace}');expect(input).toHaveValue('Daveyto');await user.clear(input);await user.type(input,'Benoni');expect(input).toHaveValue('Benoni');
  expect(await screen.findByRole('status')).toHaveTextContent('temporarily unavailable');expect(input).toBeEnabled();expect(input).not.toHaveAttribute('readonly');
  await user.keyboard('{Enter}');expect(searchPlaces).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Search places'})).toBeDisabled();
});
it('shows empty or unavailable results and never invents a place',async()=>{
  searchPlaces.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Search unavailable'));const user=userEvent.setup();render(<BusinessPlaceSearch onSelect={vi.fn()}/>);await user.type(screen.getByRole('searchbox'),'School');await user.click(screen.getByRole('button',{name:'Search places'}));expect(await screen.findByRole('status')).toHaveTextContent('No places found');await user.click(screen.getByRole('button',{name:'Search places'}));expect(await screen.findByRole('status')).toHaveTextContent('Search unavailable');expect(screen.queryByRole('list')).not.toBeInTheDocument();
});
it('cancels stale queries so an older result cannot replace the latest area',async()=>{
  let resolve;searchPlaces.mockImplementationOnce(()=>new Promise(done=>{resolve=done;})).mockResolvedValueOnce([{key:'new',label:'Latest place',latitude:0,longitude:0}]);const user=userEvent.setup();render(<BusinessPlaceSearch onSelect={vi.fn()}/>);await user.type(screen.getByRole('searchbox'),'Old place');await user.click(screen.getByRole('button',{name:'Search places'}));await user.clear(screen.getByRole('searchbox'));await user.type(screen.getByRole('searchbox'),'New place');await user.click(screen.getByRole('button',{name:'Search places'}));expect(await screen.findByRole('button',{name:'Latest place'})).toBeVisible();resolve([{key:'old',label:'Old place',latitude:1,longitude:1}]);await waitFor(()=>expect(screen.queryByRole('button',{name:'Old place'})).not.toBeInTheDocument());
});
