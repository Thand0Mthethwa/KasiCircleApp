import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkerProfile from './WorkerProfile';
import { useAuth } from '../contexts/AuthContext';
import { workerService } from '../services/api';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/api', () => ({
  workerService: {
    getMyProfile: vi.fn(),
    createMyProfile: vi.fn(),
    updateMyProfile: vi.fn(),
  },
}));

describe('WorkerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { accountType: 'WORKER' } });
  });

  it('creates a worker profile and converts entered skills and categories to lists', async () => {
    workerService.getMyProfile.mockRejectedValue({ status: 404, message: 'Not found' });
    workerService.createMyProfile.mockResolvedValue({});
    render(<MemoryRouter><WorkerProfile /></MemoryRouter>);

    fireEvent.change(await screen.findByLabelText('Professional headline'), { target: { value: 'Electrician' } });
    fireEvent.change(screen.getByLabelText('About your work'), { target: { value: 'Home wiring and repairs.' } });
    fireEvent.change(screen.getByLabelText('Skills (comma separated)'), { target: { value: 'Wiring, Repairs' } });
    fireEvent.change(screen.getByLabelText('Service categories (comma separated)'), { target: { value: 'Electrical' } });
    fireEvent.change(screen.getByLabelText('Township or city'), { target: { value: 'Soweto' } });
    fireEvent.change(screen.getByLabelText('Province'), { target: { value: 'Gauteng' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create worker profile' }));

    await waitFor(() => expect(workerService.createMyProfile).toHaveBeenCalledWith({
      headline: 'Electrician',
      bio: 'Home wiring and repairs.',
      skills: ['Wiring', 'Repairs'],
      serviceCategories: ['Electrical'],
      city: 'Soweto',
      province: 'Gauteng',
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('profile has been saved');
  });

  it('does not render a profile editor for non-worker accounts', async () => {
    useAuth.mockReturnValue({ user: { accountType: 'RESIDENT' } });
    render(<MemoryRouter><WorkerProfile /></MemoryRouter>);

    expect(await screen.findByRole('alert')).toHaveTextContent('Only worker accounts');
    expect(screen.queryByLabelText('Professional headline')).not.toBeInTheDocument();
    expect(workerService.getMyProfile).not.toHaveBeenCalled();
  });

  it('loads the existing profile and saves edits', async () => {
    workerService.getMyProfile.mockResolvedValue({
      headline: 'Electrician',
      bio: 'Home wiring',
      skills: ['Wiring'],
      serviceCategories: ['Electrical'],
      city: 'Soweto',
      province: 'Gauteng',
    });
    workerService.updateMyProfile.mockResolvedValue({});
    render(<MemoryRouter><WorkerProfile /></MemoryRouter>);

    fireEvent.change(await screen.findByLabelText('Professional headline'), { target: { value: 'Senior electrician' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(workerService.updateMyProfile).toHaveBeenCalledWith(expect.objectContaining({
      headline: 'Senior electrician',
      skills: ['Wiring'],
      serviceCategories: ['Electrical'],
    })));
    expect(await screen.findByRole('status')).toHaveTextContent('profile has been saved');
  });
});
