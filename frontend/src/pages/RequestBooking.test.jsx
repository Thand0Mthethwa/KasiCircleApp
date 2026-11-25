import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequestBooking from './RequestBooking';
import { commerceService } from '../services/api';

vi.mock('../services/api', () => ({
  commerceService: { offering: vi.fn(), request: vi.fn() },
}));

describe('requesting a service booking', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    commerceService.offering.mockResolvedValue({
      name: 'Electrical check', description: 'Check the kitchen wiring', category: 'Electrical',
      durationMinutes: 60, priceModel: 'QUOTE',
    });
  });

  it('keeps the form values and request key after a failed submission', async () => {
    commerceService.request.mockRejectedValueOnce(new Error('Connection unavailable'))
      .mockResolvedValueOnce({ id: 'new-booking' });
    render(
      <MemoryRouter initialEntries={['/services/electrical/book']}>
        <Routes>
          <Route path="/services/:id/book" element={<RequestBooking />} />
          <Route path="/bookings/:id" element={<p>Request recorded</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Quotation required')).toBeVisible();
    fireEvent.change(screen.getByLabelText('What work do you need?'), { target: { value: 'Kitchen wiring' } });
    fireEvent.change(screen.getByLabelText('Service area or location'), { target: { value: 'Daveyton' } });
    fireEvent.change(screen.getByLabelText('Preferred date and time (South Africa)'), { target: { value: '2030-01-02T00:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send booking request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable');
    expect(screen.getByLabelText('Service area or location')).toHaveValue('Daveyton');
    expect(screen.queryByText('Request recorded')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Send booking request' }));
    await waitFor(() => expect(screen.getByText('Request recorded')).toBeVisible());
    const [first, second] = commerceService.request.mock.calls.map(([input]) => input);
    expect(second).toEqual(first);
    expect(first.preferredAt).toBe('2030-01-01T22:30:00.000Z');
  });
});
