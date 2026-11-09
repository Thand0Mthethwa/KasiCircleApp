import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkerDetail from './WorkerDetail';
import { workerService } from '../services/api';

vi.mock('../services/api', () => ({
  workerService: {
    getWorkerById: vi.fn(),
  },
}));

describe('WorkerDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders public profile skills and service location without personal contact', async () => {
    workerService.getWorkerById.mockResolvedValue({
      id: 'profile-1',
      displayName: 'Amahle Dube',
      headline: 'Electrician',
      bio: 'Home wiring.',
      skills: ['Wiring'],
      serviceCategories: ['Electrical'],
      city: 'Soweto',
      province: 'Gauteng',
      email: 'private@example.com',
      phoneNumber: 'private',
    });
    render(
      <MemoryRouter initialEntries={['/workers/profile-1']}>
        <Routes><Route path="/workers/:id" element={<WorkerDetail />} /></Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Amahle Dube' })).toBeInTheDocument();
    expect(screen.getByText('Wiring')).toBeInTheDocument();
    expect(screen.queryByText('private@example.com')).not.toBeInTheDocument();
  });

  it('shows the API error when a profile cannot be loaded', async () => {
    workerService.getWorkerById.mockRejectedValue(new Error('Worker not found'));
    render(
      <MemoryRouter initialEntries={['/workers/missing']}>
        <Routes><Route path="/workers/:id" element={<WorkerDetail />} /></Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Worker not found');
  });
});
