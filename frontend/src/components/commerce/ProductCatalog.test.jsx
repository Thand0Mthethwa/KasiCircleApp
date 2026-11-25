import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductCatalog from './ProductCatalog';
import { CartProvider } from './CartContext';
import { shopService } from '../../services/api';

vi.mock('../../services/api', () => ({ shopService: { catalog: vi.fn() } }));

describe('single-business cart', () => {
  beforeEach(() => {
    sessionStorage.clear();
    shopService.catalog.mockImplementation(async (id) => ({
      content: [{
        id: `item-${id}`, name: id === 'a' ? 'Kota' : 'Bread', available: true, priceMinor: 4500,
        description: 'Fresh today', category: 'Food',
      }],
      hasNext: false,
    }));
  });

  it('retains the first cart until the customer confirms replacement', async () => {
    function screenFor(business) {
      return (
        <MemoryRouter>
          <CartProvider>
            <ProductCatalog key={business.id} business={business} owner={false} />
          </CartProvider>
        </MemoryRouter>
      );
    }
    const { rerender } = render(screenFor({ id: 'a', name: 'Kota Shop' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));
    expect(screen.getByRole('status')).toHaveTextContent('Kota added');
    rerender(screenFor({ id: 'b', name: 'Bakery' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));
    expect(screen.getByRole('group', { name: 'Replace current cart' })).toHaveTextContent('Kota Shop');
    fireEvent.click(screen.getByRole('button', { name: 'Keep current cart' }));
    const cache = () => JSON.parse(sessionStorage.getItem('kasicircle_collection_cart'));
    expect(cache().items[0].name).toBe('Kota');
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replace cart' }));
    expect(cache().items.map((item) => item.name)).toEqual(['Bread']);
    expect(cache().businessId).toBe('b');
  });
});
