import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JobForm from './JobForm';
import { jobService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../services/api', () => ({
  jobService: {
    createJob: vi.fn(),
    getJobById: vi.fn(),
    updateJob: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('Job form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { id: 'employer-1' } });
  });

  it('creates a job and opens its detail page', async () => {
    jobService.createJob.mockResolvedValue({ id: 'job-1' });
    render(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <Routes>
          <Route path="/jobs/new" element={<JobForm />} />
          <Route path="/jobs/:id" element={<p>Created job details</p>} />
        </Routes>
        <CurrentLocation />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Electrician' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Residential wiring and repairs.' } });
    fireEvent.change(screen.getByLabelText('Service category'), { target: { value: 'Electrical' } });
    fireEvent.change(screen.getByLabelText('Township or city'), { target: { value: 'Soweto' } });
    fireEvent.change(screen.getByLabelText('Province'), { target: { value: 'Gauteng' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish job' }));

    await waitFor(() => expect(jobService.createJob).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Electrician',
      employmentType: 'FULL_TIME',
      city: 'Soweto',
    })));
    expect(await screen.findByText('Created job details')).toBeInTheDocument();
  });

  it('does not load an edit form for a different employer', async () => {
    jobService.getJobById.mockResolvedValue({
      id: 'job-1',
      employerId: 'another-employer',
    });
    render(
      <MemoryRouter initialEntries={['/jobs/job-1/edit']}>
        <Routes><Route path="/jobs/:id/edit" element={<JobForm />} /></Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Only the employer');
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
  it('preserves entered details and allows retry after a save failure', async () => {
    jobService.createJob.mockRejectedValueOnce(new Error('Service temporarily unavailable'))
      .mockResolvedValueOnce({ id: 'job-retry' });
    render(<MemoryRouter initialEntries={['/jobs/new']}>
      <Routes>
        <Route path="/jobs/new" element={<JobForm />} />
        <Route path="/jobs/:id" element={<p>Saved after retry</p>} />
      </Routes>
    </MemoryRouter>);
    for (const [label, value] of Object.entries({ 'Job title': 'Plumber', Description: 'Fix pipes', 'Service category': 'Plumbing', 'Township or city': 'Soweto', Province: 'Gauteng' })) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Publish job' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Service temporarily unavailable');
    expect(screen.getByLabelText('Job title')).toHaveValue('Plumber');
    fireEvent.click(screen.getByRole('button', { name: 'Publish job' }));
    expect(await screen.findByText('Saved after retry')).toBeInTheDocument();
    expect(jobService.createJob).toHaveBeenCalledTimes(2);
  });

});
