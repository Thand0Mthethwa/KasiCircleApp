import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paymentService } from '../../services/api';
import PaymentPanel from './PaymentPanel';

vi.mock('../../services/api', () => ({ paymentService: { history: vi.fn(), initialize: vi.fn(), verify: vi.fn() } }));

const required = { enabled: true, canInitialize: true, amountMinor: 4500, attempts: [] };
const attempt = { reference: 'KC-fixture', status: 'PROCESSING', amountMinor: 4500, canVerify: true,
  updatedAt: '2026-11-26T10:00:00Z' };

describe('commerce payments', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retains direct payment when online checkout is unavailable', async () => {
    paymentService.history.mockResolvedValue({ ...required, enabled: false, canInitialize: false });
    render(<PaymentPanel kind="ORDER" id="order" label="QA order" />);
    expect(await screen.findByText('Online checkout is currently unavailable.')).toBeVisible();
    expect(screen.getByText('Payment outside KasiCircle')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Pay online' })).toBeNull();
  });

  it('displays the authoritative summary and waits for a verified result', async () => {
    paymentService.history.mockResolvedValueOnce(required)
      .mockResolvedValueOnce({ ...required, canInitialize: false, attempts: [attempt] })
      .mockResolvedValueOnce({ ...required, canInitialize: false, attempts: [{ ...attempt, status: 'PAID' }] });
    paymentService.initialize.mockResolvedValue(attempt);
    paymentService.verify.mockResolvedValue({ ...attempt, status: 'PAID' });
    render(<PaymentPanel kind="BOOKING" id="booking" label="Electrical check" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Pay online' }));
    expect(screen.getByText(/Electrical check.*45/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Start test checkout' }));
    expect(await screen.findByText('Payment pending', { exact: true })).toBeVisible();
    expect(screen.queryByText('Test payment verified')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Check payment status' }));
    expect(await screen.findByText('Test payment verified')).toBeVisible();
    expect(paymentService.initialize).toHaveBeenCalledWith('BOOKING', 'booking');
  });

  it('shows failed and abandoned attempts with a retry action', async () => {
    paymentService.history.mockResolvedValue({ ...required, attempts: [
      { ...attempt, status: 'FAILED' },
      { ...attempt, reference: 'KC-other', status: 'ABANDONED' },
    ] });
    render(<PaymentPanel kind="ORDER" id="order" label="QA order" />);
    expect(await screen.findByText('Test payment failed')).toBeVisible();
    expect(screen.getByText('Test checkout abandoned')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry online payment' })).toBeVisible();
  });
});
