import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusinessDetail from './BusinessDetail';
import { businessService } from '../services/api';

// Mock businessService
vi.mock('../services/api', () => ({
  businessService: {
    getBusinessById: vi.fn(),
  },
}));

// Mock react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BusinessDetail (Dedicated Business Detail Page)', () => {
  const mockBusiness = {
    id: 'biz-123',
    name: 'Kasi Fresh Cafe',
    category: 'Food & Beverage',
    description: 'Serving delicious township meals and refreshments daily.',
    phoneNumber: '+27821112222',
    email: 'info@kasifresh.co.za',
    address: '45 Vilakazi Street',
    city: 'Soweto',
    province: 'Gauteng',
    ownerId: 'owner-1',
    createdAt: '2026-10-01T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (businessId = 'biz-123') =>
    render(
      <MemoryRouter initialEntries={[`/businesses/${businessId}`]}>
        <Routes>
          <Route path="/businesses/:id" element={<BusinessDetail />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders loading state initially and fetches business by URL ID', async () => {
    businessService.getBusinessById.mockResolvedValue(mockBusiness);

    renderComponent('biz-123');

    // Loading state is present initially
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();

    await waitFor(() => {
      expect(businessService.getBusinessById).toHaveBeenCalledWith('biz-123');
    });

    // Content renders
    expect(await screen.findByRole('heading', { level: 1, name: 'Kasi Fresh Cafe' })).toBeInTheDocument();
  });

  it('renders complete business information correctly', async () => {
    businessService.getBusinessById.mockResolvedValue(mockBusiness);

    renderComponent('biz-123');

    expect(await screen.findByRole('heading', { level: 1, name: 'Kasi Fresh Cafe' })).toBeInTheDocument();
    expect(screen.getByText('Food & Beverage')).toBeInTheDocument();
    expect(screen.getByText('Serving delicious township meals and refreshments daily.')).toBeInTheDocument();
    expect(screen.getByText(/45 Vilakazi Street, Soweto, Gauteng/i)).toBeInTheDocument();
    expect(screen.getAllByText('Soweto, Gauteng').length).toBeGreaterThan(0);
    expect(screen.getByText(/Registered on/i)).toBeInTheDocument();
  });

  it('renders phone and email links with correct tel: and mailto: protocols', async () => {
    businessService.getBusinessById.mockResolvedValue(mockBusiness);

    renderComponent('biz-123');

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    const phoneLinks = screen.getAllByRole('link', { name: /call/i });
    expect(phoneLinks[0]).toHaveAttribute('href', 'tel:+27821112222');

    const emailLinks = screen.getAllByRole('link', { name: /email/i });
    expect(emailLinks[0]).toHaveAttribute('href', 'mailto:info@kasifresh.co.za');
  });

  it('does not render phone or email sections if not present on the business', async () => {
    const businessWithoutContacts = {
      ...mockBusiness,
      phoneNumber: null,
      email: null,
    };
    businessService.getBusinessById.mockResolvedValue(businessWithoutContacts);

    renderComponent('biz-123');

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Phone Number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Email Address/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /call/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /email/i })).not.toBeInTheDocument();
  });

  it('displays friendly 404 not-found state when business does not exist', async () => {
    const notFoundError = new Error('Business with ID unknown-id not found.');
    notFoundError.status = 404;
    businessService.getBusinessById.mockRejectedValue(notFoundError);

    renderComponent('unknown-id');

    expect(await screen.findByTestId('not-found-state')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /business not found/i })).toBeInTheDocument();
    expect(screen.getByText(/listing you are looking for does not exist/i)).toBeInTheDocument();

    // Directory navigation button works
    const browseBtn = screen.getByRole('button', { name: /browse business directory/i });
    await userEvent.click(browseBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/businesses');
  });

  it('displays error state and allows user to retry on unexpected failure', async () => {
    const user = userEvent.setup();
    const networkError = new Error('Network connection failed');
    businessService.getBusinessById.mockRejectedValueOnce(networkError);

    renderComponent('biz-123');

    expect(await screen.findByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /failed to load business/i })).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();

    // Mock successful retry
    businessService.getBusinessById.mockResolvedValueOnce(mockBusiness);

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    expect(await screen.findByRole('heading', { level: 1, name: 'Kasi Fresh Cafe' })).toBeInTheDocument();
  });

  it('triggers native navigator.share when available', async () => {
    const user = userEvent.setup();
    businessService.getBusinessById.mockResolvedValue(mockBusiness);

    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    renderComponent('biz-123');

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    const shareBtn = screen.getAllByRole('button', { name: /share/i })[0];
    await user.click(shareBtn);

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Kasi Fresh Cafe'),
        url: window.location.href,
      })
    );
  });

  it('falls back to clipboard copy and shows confirmation feedback when navigator.share is not supported', async () => {
    const user = userEvent.setup();
    businessService.getBusinessById.mockResolvedValue(mockBusiness);

    // Remove navigator.share to trigger fallback
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    renderComponent('biz-123');

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    const shareBtn = screen.getAllByRole('button', { name: /share/i })[0];
    await user.click(shareBtn);

    expect(mockWriteText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument();
  });

  it('navigates back to business directory when clicking back button', async () => {
    const user = userEvent.setup();
    businessService.getBusinessById.mockResolvedValue(mockBusiness);

    renderComponent('biz-123');

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /back to business directory/i });
    await user.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/businesses');
  });
});
