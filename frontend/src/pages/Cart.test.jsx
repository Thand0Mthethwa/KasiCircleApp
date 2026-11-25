import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { CartProvider } from '../components/commerce/CartContext';
import { shopService } from '../services/api';
import Cart from './Cart';

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock('../services/api', () => ({ shopService: { review: vi.fn(), place: vi.fn() } }));

it('retries an uncertain submission with the same key and unlocks the cart after a price conflict', async () => {
  const item = { productId: 'kota', name: 'Classic kota', quantity: 2, priceMinor: 3500 };
  sessionStorage.setItem('kasicircle_collection_cart', JSON.stringify({
    businessId: 'shop', businessName: 'Kota Shop', items: [item],
  }));
  const review = {
    businessName: 'Kota Shop', collectionAddress: '1 Main Road',
    items: [{ ...item, available: true }], totalMinor: 7000, ready: true,
  };
  shopService.review.mockResolvedValueOnce(review).mockResolvedValueOnce({
    ...review, items: [{ ...item, available: true, priceMinor: 4000 }], totalMinor: 8000, ready: false,
  });
  shopService.place.mockRejectedValueOnce(new Error('Connection unavailable'))
    .mockRejectedValueOnce(Object.assign(new Error('Price has changed'), { status: 409 }));

  render(<MemoryRouter><CartProvider><Cart /></CartProvider></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Review collection order' }));
  fireEvent.click(await screen.findByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Place order' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Retry same order' }));

  expect(await screen.findByRole('heading', { name: 'Review changes to your cart' })).toBeVisible();
  expect(shopService.place.mock.calls[1][0]).toEqual(shopService.place.mock.calls[0][0]);
  expect(screen.getByLabelText('Quantity for Classic kota')).toBeEnabled();
  expect(screen.queryByRole('button', { name: 'Place order' })).toBeNull();
  sessionStorage.clear();
});
