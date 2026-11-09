import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyJobApplications from './MyJobApplications';
import { jobService } from '../services/api';

vi.mock('../services/api', () => ({
  jobService: { getMyApplications: vi.fn() },
}));

describe('My job applications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows only the current user application response fields', async () => {
    jobService.getMyApplications.mockResolvedValue({
      content: [{
        id: 'application-1',
        jobId: 'job-1',
        jobTitle: 'Electrician',
        employerName: 'Local Employer',
        status: 'PENDING',
        message: 'I have experience.',
      }],
      totalPages: 1,
    });
    render(<MemoryRouter><MyJobApplications /></MemoryRouter>);

    expect(await screen.findByText('Electrician')).toBeInTheDocument();
    expect(screen.getByText(/Status: PENDING/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View job' })).toHaveAttribute('href', '/jobs/job-1');
  });

  it('shows an empty state and browse action', async () => {
    jobService.getMyApplications.mockResolvedValue({ content: [], totalPages: 0 });
    render(<MemoryRouter><MyJobApplications /></MemoryRouter>);

    expect(await screen.findByTestId('applications-empty-state')).toHaveTextContent('not applied');
  });
});
