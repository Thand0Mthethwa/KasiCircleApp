import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReportForm from './ReportForm';
import { reportService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../services/api', () => ({
  reportService: {
    createReport: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ReportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits the authenticated report for the target content', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    reportService.createReport.mockResolvedValue({ id: 'report-1' });
    render(<MemoryRouter><ReportForm targetType="JOB" targetId="job-1" /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Report this content' }));
    fireEvent.change(screen.getByLabelText('Details (optional)'), { target: { value: 'Suspicious listing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => expect(reportService.createReport).toHaveBeenCalledWith({
      targetType: 'JOB',
      targetId: 'job-1',
      reason: 'INAPPROPRIATE',
      details: 'Suspicious listing',
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('submitted for review');
  });

  it('requires sign-in before enabling report submission', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    render(<MemoryRouter><ReportForm targetType="BUSINESS" targetId="business-1" /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Report this content' }));
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Submit report' })).not.toBeInTheDocument();
  });

  it('shows report submission errors', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    reportService.createReport.mockRejectedValue(new Error('Report unavailable'));
    render(<MemoryRouter><ReportForm targetType="JOB" targetId="job-1" /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Report this content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Report unavailable');
  });
});
