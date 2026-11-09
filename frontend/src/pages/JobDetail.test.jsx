import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JobDetail from './JobDetail';
import { jobService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../services/api', () => ({
  jobService: {
    getJobById: vi.fn(),
    applyForJob: vi.fn(),
    getApplicationsForJob: vi.fn(),
    updateApplicationStatus: vi.fn(),
    updateJobStatus: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const job = {
  id: 'job-1',
  employerId: 'employer-1',
  employerName: 'Local Employer',
  title: 'Electrician',
  description: 'Residential wiring and repairs.',
  category: 'Electrical',
  employmentType: 'FULL_TIME',
  status: 'OPEN',
  city: 'Soweto',
  province: 'Gauteng',
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/jobs/job-1']}>
      <Routes><Route path="/jobs/:id" element={<JobDetail />} /></Routes>
    </MemoryRouter>
  );
}

describe('Job detail and applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobService.getJobById.mockResolvedValue(job);
  });

  it('lets an authenticated non-employer submit an application', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'applicant-1' } });
    jobService.applyForJob.mockResolvedValue({ id: 'application-1' });
    renderDetail();

    fireEvent.change(await screen.findByLabelText('Application message'), {
      target: { value: 'I have relevant experience.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply for this job' }));

    await waitFor(() => expect(jobService.applyForJob).toHaveBeenCalledWith(
      'job-1',
      'I have relevant experience.'
    ));
    expect(await screen.findByRole('status')).toHaveTextContent('application has been submitted');
  });

  it('lets only the employer view and review applicants without exposing contact data', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'employer-1' } });
    jobService.getApplicationsForJob.mockResolvedValue([{
      id: 'application-1',
      applicantId: 'applicant-1',
      applicantName: 'Worker Name',
      message: 'I have relevant experience.',
      status: 'PENDING',
    }]);
    jobService.updateApplicationStatus.mockResolvedValue({ status: 'ACCEPTED' });
    renderDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'View applications' }));
    expect(await screen.findByText('Worker Name')).toBeInTheDocument();
    expect(screen.queryByText(/email|phone/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(jobService.updateApplicationStatus).toHaveBeenCalledWith(
      'job-1',
      'application-1',
      'ACCEPTED'
    ));
    expect(screen.getByText('Status: ACCEPTED')).toBeInTheDocument();
  });

  it('does not show employer controls to another authenticated user', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'other-user' } });
    renderDetail();

    await screen.findByText('Electrician');
    expect(screen.queryByRole('button', { name: 'View applications' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit job' })).not.toBeInTheDocument();
  });
});
