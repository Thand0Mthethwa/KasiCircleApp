import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusinessReviews from './BusinessReviews';
import { useAuth } from '../contexts/AuthContext';
import { businessService } from '../services/api';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock businessService
vi.mock('../services/api', () => ({
  businessService: {
    getMyBusinesses: vi.fn(),
    getBusinessReviews: vi.fn(),
    getBusinessReviewSummary: vi.fn(),
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

describe('BusinessReviews Page (Business Owner Review Dashboard)', () => {
  const mockBusinessUser = {
    id: 'user-biz-1',
    firstName: 'Bongani',
    lastName: 'Zulu',
    email: 'bongani@kasifresh.co.za',
    accountType: 'BUSINESS',
  };

  const mockResidentUser = {
    id: 'user-res-1',
    firstName: 'Nomsa',
    lastName: 'Dlamini',
    email: 'nomsa@gmail.com',
    accountType: 'RESIDENT',
  };

  const mockWorkerUser = {
    id: 'user-wrk-1',
    firstName: 'Sipho',
    lastName: 'Khoza',
    email: 'sipho@work.co.za',
    accountType: 'WORKER',
  };

  const mockBusiness = {
    id: 'biz-1',
    name: 'Kasi Fresh Cafe',
    category: 'Food & Beverage',
    description: 'Fresh township meals and coffee.',
    phoneNumber: '+27821112222',
    email: 'contact@kasifresh.co.za',
    address: '12 Vilikazi St',
    city: 'Soweto',
    province: 'Gauteng',
    ownerId: 'user-biz-1',
    averageRating: 4.8,
    reviewCount: 25,
  };

  const mockReviewSummary = {
    businessId: 'biz-1',
    averageRating: 4.8,
    totalReviews: 25,
    fiveStarCount: 20,
    fourStarCount: 3,
    threeStarCount: 1,
    twoStarCount: 1,
    oneStarCount: 0,
  };

  const mockReviews = [
    {
      id: 'rev-1',
      businessId: 'biz-1',
      rating: 5,
      comment: 'Absolutely love their morning coffee and vetkoek!',
      authorName: 'Thabo M.',
      createdAt: '2026-10-15T09:30:00Z',
      updatedAt: '2026-10-15T09:30:00Z',
    },
    {
      id: 'rev-2',
      businessId: 'biz-1',
      rating: 4,
      comment: 'Great service, friendly staff and prompt delivery.',
      authorName: 'Lerato K.',
      createdAt: '2026-10-18T14:15:00Z',
      updatedAt: '2026-10-18T14:15:00Z',
    },
    {
      id: 'rev-3',
      businessId: 'biz-1',
      rating: 5,
      comment: null, // Test missing / null comment
      authorName: 'Anonymous',
      createdAt: '2026-10-20T11:00:00Z',
      updatedAt: '2026-10-20T11:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockBusinessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValue({
      content: [mockBusiness],
      totalElements: 1,
      totalPages: 1,
      number: 0,
    });
    businessService.getBusinessReviewSummary.mockResolvedValue(mockReviewSummary);
    businessService.getBusinessReviews.mockResolvedValue({
      content: mockReviews,
      totalElements: 25,
      totalPages: 3,
      number: 0,
    });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BusinessReviews />
      </BrowserRouter>
    );

  // ---------------------------------------------------------------------------
  // 1. BUSINESS account can access the dashboard
  // ---------------------------------------------------------------------------
  it('1. allows BUSINESS account to access the dashboard and renders dashboard elements', async () => {
    renderComponent();

    // Check header
    expect(await screen.findByRole('heading', { level: 1, name: 'Reviews & Feedback' })).toBeInTheDocument();

    // Check business title & details
    expect(await screen.findByTestId('business-name-heading')).toHaveTextContent('Kasi Fresh Cafe');
    expect(screen.getByText('Food & Beverage')).toBeInTheDocument();
    expect(screen.getByText('Soweto')).toBeInTheDocument();

    // KPI cards exist
    expect(screen.getByTestId('kpi-cards')).toBeInTheDocument();

    // Rating distribution exists
    expect(screen.getByTestId('rating-distribution-card')).toBeInTheDocument();

    // Customer feedback section exists
    expect(screen.getByTestId('customer-reviews-section')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 2. Non-BUSINESS account is restricted
  // ---------------------------------------------------------------------------
  it('2. restricts access for non-BUSINESS accounts (RESIDENT and WORKER)', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockResidentUser,
      isLoading: false,
    });

    renderComponent();

    const restrictedCard = await screen.findByTestId('access-restricted-card');
    expect(restrictedCard).toBeInTheDocument();
    expect(screen.getByText('Business Account Required')).toBeInTheDocument();
    expect(screen.getByText(/Your account type is/i)).toHaveTextContent('RESIDENT');

    // Never attempts to fetch businesses or reviews
    expect(businessService.getMyBusinesses).not.toHaveBeenCalled();
    expect(businessService.getBusinessReviews).not.toHaveBeenCalled();

    // Return to Profile button
    const returnBtn = screen.getByRole('button', { name: /Return to Profile/i });
    const user = userEvent.setup();
    await user.click(returnBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('2b. restricts access for WORKER accounts as well', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockWorkerUser,
      isLoading: false,
    });

    renderComponent();

    const restrictedCard = await screen.findByTestId('access-restricted-card');
    expect(restrictedCard).toBeInTheDocument();
    expect(screen.getByText(/Your account type is/i)).toHaveTextContent('WORKER');
  });

  // ---------------------------------------------------------------------------
  // 3. Business information is resolved using getMyBusinesses
  // ---------------------------------------------------------------------------
  it('3. resolves business information using getMyBusinesses(0, 1)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(businessService.getMyBusinesses).toHaveBeenCalledWith(0, 1);
    });

    expect(await screen.findByTestId('business-name-heading')).toHaveTextContent('Kasi Fresh Cafe');
    expect(businessService.getBusinessReviews).toHaveBeenCalledWith('biz-1', 0, 10);
    expect(businessService.getBusinessReviewSummary).toHaveBeenCalledWith('biz-1');
  });

  // ---------------------------------------------------------------------------
  // 4. Empty business registration state
  // ---------------------------------------------------------------------------
  it('4. displays friendly empty state when user has no registered business profile', async () => {
    businessService.getMyBusinesses.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
    });

    renderComponent();

    const emptyCard = await screen.findByTestId('no-business-registered');
    expect(emptyCard).toBeInTheDocument();
    expect(screen.getByText('No Business Profile Registered')).toBeInTheDocument();
    expect(screen.getByText(/You haven't registered a business profile yet/i)).toBeInTheDocument();

    const registerBtn = screen.getByTestId('register-business-btn');
    const user = userEvent.setup();
    await user.click(registerBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/business-profile');

    // Does not call review endpoints without business
    expect(businessService.getBusinessReviews).not.toHaveBeenCalled();
    expect(businessService.getBusinessReviewSummary).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 5. Loading states
  // ---------------------------------------------------------------------------
  it('5. renders loading state while resolving business listing and reviews', async () => {
    businessService.getMyBusinesses.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    renderComponent();

    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    expect(screen.getByText(/Resolving your business listing/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 6. Review summary values
  // ---------------------------------------------------------------------------
  it('6. displays correct review summary KPI values (average, total, 5-star count)', async () => {
    renderComponent();

    await screen.findByTestId('kpi-cards');

    // Average rating
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();

    // Total reviews
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Total Reviews')).toBeInTheDocument();

    // 5-star count
    const kpiCards = screen.getByTestId('kpi-cards');
    expect(within(kpiCards).getByText('20')).toBeInTheDocument();
    expect(screen.getByText('5-Star Reviews')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 7. Five-star through one-star distribution
  // ---------------------------------------------------------------------------
  it('7. displays five-star through one-star distribution with progress bars', async () => {
    renderComponent();

    const distributionCard = await screen.findByTestId('rating-distribution-card');
    expect(distributionCard).toBeInTheDocument();

    const bars = screen.getByTestId('rating-distribution-bars');
    expect(bars).toBeInTheDocument();

    // Check count numbers
    expect(bars).toHaveTextContent('20'); // 5-star
    expect(bars).toHaveTextContent('3');  // 4-star
    expect(bars).toHaveTextContent('1');  // 3-star
    expect(bars).toHaveTextContent('1');  // 2-star
    expect(bars).toHaveTextContent('0');  // 1-star

    // Progressbars exist with aria attributes
    const progressbars = screen.getAllByRole('progressbar');
    expect(progressbars.length).toBe(5);
    expect(progressbars[0]).toHaveAttribute('aria-label', '5 stars: 20 reviews');
    expect(progressbars[0]).toHaveAttribute('aria-valuenow', '80'); // 20 / 25 * 100 = 80%
  });

  // ---------------------------------------------------------------------------
  // 8. Customer review cards
  // ---------------------------------------------------------------------------
  it('8. renders customer review cards with safe author name, date, stars, and comments', async () => {
    renderComponent();

    await screen.findByTestId('reviews-list');

    // Review 1
    const card1 = screen.getByTestId('review-card-rev-1');
    expect(card1).toBeInTheDocument();
    expect(screen.getByTestId('review-author-rev-1')).toHaveTextContent('Thabo M.');
    expect(screen.getByTestId('review-date-rev-1')).toHaveTextContent(/Oct 15, 2026/);
    expect(screen.getByTestId('review-comment-rev-1')).toHaveTextContent('Absolutely love their morning coffee and vetkoek!');
    expect(screen.getByTestId('review-stars-rev-1')).toBeInTheDocument();

    // Review 2
    const card2 = screen.getByTestId('review-card-rev-2');
    expect(card2).toBeInTheDocument();
    expect(screen.getByTestId('review-author-rev-2')).toHaveTextContent('Lerato K.');
    expect(screen.getByTestId('review-comment-rev-2')).toHaveTextContent('Great service, friendly staff and prompt delivery.');
  });

  // ---------------------------------------------------------------------------
  // 9. Safe author display & PII protection
  // ---------------------------------------------------------------------------
  it('9. displays safe author names and protects customer privacy (no email, phone, or internal ID)', async () => {
    renderComponent();

    await screen.findByTestId('reviews-list');

    // Safe names rendered
    expect(screen.getByText('Thabo M.')).toBeInTheDocument();
    expect(screen.getByText('Lerato K.')).toBeInTheDocument();
    expect(screen.getByText('Anonymous')).toBeInTheDocument();

    // Reviewer avatar initial is present
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();

    // No private details exposed
    expect(screen.queryByText(/@gmail\.com/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/@kasifresh\.co\.za/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+27/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/user-id/i)).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 10. Missing comments
  // ---------------------------------------------------------------------------
  it('10. renders cleanly without errors when a review has no comment', async () => {
    renderComponent();

    await screen.findByTestId('reviews-list');

    const card3 = screen.getByTestId('review-card-rev-3');
    expect(card3).toBeInTheDocument();
    expect(screen.getByTestId('review-author-rev-3')).toHaveTextContent('Anonymous');
    expect(screen.queryByTestId('review-comment-rev-3')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 11. Zero reviews
  // ---------------------------------------------------------------------------
  it('11. handles zero reviews gracefully without NaN or division-by-zero errors', async () => {
    businessService.getBusinessReviewSummary.mockResolvedValue({
      businessId: 'biz-1',
      averageRating: 0.0,
      totalReviews: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
    });
    businessService.getBusinessReviews.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
    });

    renderComponent();

    await screen.findByTestId('kpi-cards');

    // Zero KPI cards
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);

    // No NaN anywhere on screen
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();

    // Empty distribution message
    expect(screen.getByTestId('rating-distribution-empty')).toBeInTheDocument();

    // Empty customer feedback card
    expect(screen.getByTestId('empty-reviews-state')).toBeInTheDocument();
    expect(screen.getByText('No customer reviews yet')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 12. API error and retry
  // ---------------------------------------------------------------------------
  it('12a. displays error state when business loading fails and supports retry', async () => {
    businessService.getMyBusinesses.mockRejectedValueOnce(new Error('Network connection timeout'));

    renderComponent();

    const errorCard = await screen.findByTestId('dashboard-error');
    expect(errorCard).toBeInTheDocument();
    expect(screen.getByText(/Network connection timeout/i)).toBeInTheDocument();

    // Retry
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockBusiness],
      totalElements: 1,
      totalPages: 1,
    });

    const user = userEvent.setup();
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    await user.click(retryBtn);

    expect(await screen.findByTestId('business-name-heading')).toHaveTextContent('Kasi Fresh Cafe');
  });

  it('12b. displays error state when reviews loading fails and supports retry', async () => {
    businessService.getBusinessReviews.mockRejectedValueOnce(new Error('Reviews service unavailable'));

    renderComponent();

    const reviewsError = await screen.findByTestId('reviews-error');
    expect(reviewsError).toBeInTheDocument();
    expect(screen.getByText(/Reviews service unavailable/i)).toBeInTheDocument();

    // Retry reviews
    businessService.getBusinessReviews.mockResolvedValueOnce({
      content: mockReviews,
      totalElements: 25,
      totalPages: 3,
      number: 0,
    });

    const user = userEvent.setup();
    const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i });
    await user.click(tryAgainBtn);

    expect(await screen.findByTestId('reviews-list')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 13. Pagination
  // ---------------------------------------------------------------------------
  it('13. handles pagination controls, page boundaries, and fetches corresponding pages', async () => {
    const user = userEvent.setup();
    renderComponent();

    await screen.findByTestId('pagination-controls');

    const prevBtn = screen.getByTestId('pagination-prev');
    const nextBtn = screen.getByTestId('pagination-next');
    const pageInfo = screen.getByTestId('pagination-info');

    // On page 0: Previous is disabled, Next is enabled
    expect(pageInfo).toHaveTextContent('Page 1 of 3');
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Click Next
    await user.click(nextBtn);

    await waitFor(() => {
      expect(businessService.getBusinessReviews).toHaveBeenCalledWith('biz-1', 1, 10);
    });
  });

  // ---------------------------------------------------------------------------
  // 14. Strictly read-only: No edit, delete, or moderation controls
  // ---------------------------------------------------------------------------
  it('14. guarantees strictly read-only dashboard without edit, delete, or reply buttons', async () => {
    renderComponent();

    await screen.findByTestId('reviews-list');

    // There should be no buttons for editing or deleting customer reviews
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /moderate/i })).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 15. Back navigation and quick links
  // ---------------------------------------------------------------------------
  it('15. supports navigation back to /business-profile and to public page', async () => {
    const user = userEvent.setup();
    renderComponent();

    await screen.findByTestId('business-name-heading');

    // Header back button
    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/business-profile');

    // Footer "Manage Business Profile" button
    const manageBtn = screen.getByTestId('back-to-profile-btn');
    await user.click(manageBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/business-profile');

    // Footer "View Public Page" button
    const publicBtn = screen.getByTestId('view-public-page-btn');
    await user.click(publicBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/businesses/biz-1');
  });
});
