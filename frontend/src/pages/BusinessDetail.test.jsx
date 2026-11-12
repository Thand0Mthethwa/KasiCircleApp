import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusinessDetail from './BusinessDetail';
import { businessService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock businessService
vi.mock('../services/api', () => ({
  businessService: {
    getBusinessById: vi.fn(),
    getBusinessImages: vi.fn(),
    getBusinessReviews: vi.fn(),
    getBusinessReviewSummary: vi.fn(),
    getMyReview: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
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
    coverImageUrl: null,
  };

  const mockImages = [
    {
      id: 'img-1',
      businessId: 'biz-123',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/kasicircle/cover.jpg',
      storageId: 'kasicircle/cover',
      fileName: 'storefront.jpg',
      contentType: 'image/jpeg',
      fileSize: 1548290,
      isCover: true,
      sortOrder: 0,
      createdAt: '2026-10-01T10:00:00Z',
    },
    {
      id: 'img-2',
      businessId: 'biz-123',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/kasicircle/interior.jpg',
      storageId: 'kasicircle/interior',
      fileName: 'dining-area.jpg',
      contentType: 'image/jpeg',
      fileSize: 1200000,
      isCover: false,
      sortOrder: 0,
      createdAt: '2026-10-02T10:00:00Z',
    },
    {
      id: 'img-3',
      businessId: 'biz-123',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/kasicircle/food.jpg',
      storageId: 'kasicircle/food',
      fileName: 'signature-dish.jpg',
      contentType: 'image/jpeg',
      fileSize: 980000,
      isCover: false,
      sortOrder: 0,
      createdAt: '2026-10-03T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
    businessService.getBusinessImages.mockResolvedValue([]);
    businessService.getBusinessReviews.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
    });
    businessService.getBusinessReviewSummary.mockResolvedValue({
      businessId: 'biz-123',
      averageRating: 0.0,
      totalReviews: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
    });
    businessService.getMyReview.mockResolvedValue(null);
    businessService.createReview.mockResolvedValue({});
    businessService.updateReview.mockResolvedValue({});
    businessService.deleteReview.mockResolvedValue(null);
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

  it('renders prominent cover image when business has a cover photo', async () => {
    const businessWithCover = {
      ...mockBusiness,
      coverImageUrl: mockImages[0].imageUrl,
    };
    businessService.getBusinessById.mockResolvedValue(businessWithCover);
    businessService.getBusinessImages.mockResolvedValue([mockImages[0]]);

    renderComponent('biz-123');

    const coverContainer = await screen.findByTestId('business-cover-image');
    expect(coverContainer).toBeInTheDocument();

    const coverImg = screen.getByAltText('Kasi Fresh Cafe cover photo');
    expect(coverImg).toHaveAttribute('src', mockImages[0].imageUrl);
    expect(screen.getByText('Cover Photo')).toBeInTheDocument();
  });

  it('renders multiple gallery images in a responsive grid with appropriate alt text', async () => {
    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessImages.mockResolvedValue(mockImages);

    renderComponent('biz-123');

    const gallery = await screen.findByTestId('business-image-gallery');
    expect(gallery).toBeInTheDocument();

    // 3 gallery thumbnails
    expect(screen.getByTestId('gallery-image-img-1')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-image-img-2')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-image-img-3')).toBeInTheDocument();

    // Appropriate alt text for accessibility
    expect(screen.getByAltText('Kasi Fresh Cafe - storefront.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('Kasi Fresh Cafe - dining-area.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('Kasi Fresh Cafe - signature-dish.jpg')).toBeInTheDocument();

    // Cover badge on first image
    expect(screen.getByText('Cover')).toBeInTheDocument();
    expect(screen.getAllByText('3 photos').length).toBeGreaterThanOrEqual(1);
  });

  it('renders professional placeholders when business has no uploaded images', async () => {
    const businessWithoutCover = { ...mockBusiness, coverImageUrl: null };
    businessService.getBusinessById.mockResolvedValue(businessWithoutCover);
    businessService.getBusinessImages.mockResolvedValue([]);

    renderComponent('biz-123');

    // Cover placeholder
    expect(await screen.findByTestId('business-cover-placeholder')).toBeInTheDocument();
    expect(screen.getByText('No cover photo provided')).toBeInTheDocument();
    expect(screen.queryByText('Verified Business Listing')).not.toBeInTheDocument();

    // Gallery empty state
    expect(screen.getByTestId('gallery-empty')).toBeInTheDocument();
    expect(screen.getByText('No photos uploaded yet')).toBeInTheDocument();
    expect(screen.queryByTestId('business-image-gallery')).not.toBeInTheDocument();
  });

  it('displays gallery loading spinner while image API request is pending', async () => {
    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessImages.mockImplementation(() => new Promise(() => {}));

    renderComponent('biz-123');

    expect(await screen.findByTestId('gallery-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading photos...')).toBeInTheDocument();
  });

  it('handles image API error gracefully and allows user to retry loading photos', async () => {
    const user = userEvent.setup();
    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessImages.mockRejectedValueOnce(new Error('Gallery server offline'));

    renderComponent('biz-123');

    // Gallery error is rendered
    expect(await screen.findByTestId('gallery-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load gallery photos')).toBeInTheDocument();
    expect(screen.getByText('Gallery server offline')).toBeInTheDocument();

    // Main business details are still completely intact
    expect(screen.getByRole('heading', { level: 1, name: 'Kasi Fresh Cafe' })).toBeInTheDocument();
    expect(screen.getByText('Serving delicious township meals and refreshments daily.')).toBeInTheDocument();

    // Retry gallery images
    businessService.getBusinessImages.mockResolvedValueOnce(mockImages);
    const retryBtn = screen.getByRole('button', { name: /retry photos/i });
    await user.click(retryBtn);

    expect(await screen.findByTestId('business-image-gallery')).toBeInTheDocument();
    expect(screen.queryByTestId('gallery-error')).not.toBeInTheDocument();
  });

  it('supports public viewing of images without authentication', async () => {
    localStorage.clear();

    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessImages.mockResolvedValue(mockImages);

    renderComponent('biz-123');

    expect(await screen.findByRole('heading', { level: 1, name: 'Kasi Fresh Cafe' })).toBeInTheDocument();
    expect(screen.getByTestId('business-cover-image')).toBeInTheDocument();
    expect(screen.getByTestId('business-image-gallery')).toBeInTheDocument();
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  it('opens lightbox when clicking gallery image and supports next/prev navigation and close', async () => {
    const user = userEvent.setup();
    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessImages.mockResolvedValue(mockImages);

    renderComponent('biz-123');

    await screen.findByTestId('business-image-gallery');

    // Click second thumbnail
    const thumb2 = screen.getByTestId('gallery-image-img-2');
    await user.click(thumb2);

    // Lightbox opens showing 2 of 3
    const lightbox = screen.getByTestId('image-lightbox');
    expect(lightbox).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('2 of 3');
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', mockImages[1].imageUrl);

    // Click Next -> moves to image 3
    const nextBtn = screen.getByTestId('lightbox-next');
    await user.click(nextBtn);
    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('3 of 3');
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', mockImages[2].imageUrl);

    // Click Next on last image -> wraps to image 1 (Cover photo)
    await user.click(nextBtn);
    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('1 of 3');
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', mockImages[0].imageUrl);

    // Click Prev -> wraps back to image 3
    const prevBtn = screen.getByTestId('lightbox-prev');
    await user.click(prevBtn);
    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('3 of 3');

    // Close lightbox
    const closeBtn = screen.getByTestId('lightbox-close');
    await user.click(closeBtn);
    expect(screen.queryByTestId('image-lightbox')).not.toBeInTheDocument();
  });

  it('opens lightbox when clicking the cover hero image and closes on Escape key', async () => {
    const user = userEvent.setup();
    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessImages.mockResolvedValue(mockImages);

    renderComponent('biz-123');

    const coverContainer = await screen.findByTestId('business-cover-image');
    await user.click(coverContainer);

    expect(screen.getByTestId('image-lightbox')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('1 of 3');

    // Press Escape
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('image-lightbox')).not.toBeInTheDocument();
  });

  const mockReviews = [
    {
      id: 'rev-1',
      businessId: 'biz-123',
      rating: 5,
      comment: 'Best chisa nyama in Soweto! Friendly staff and vibrant atmosphere.',
      authorName: 'Thabo M.',
      createdAt: '2026-11-01T12:00:00Z',
      updatedAt: '2026-11-01T12:00:00Z',
    },
    {
      id: 'rev-2',
      businessId: 'biz-123',
      rating: 4,
      comment: 'Great township experience. Quick service and reasonable prices.',
      authorName: 'Lerato K.',
      createdAt: '2026-11-02T14:30:00Z',
      updatedAt: '2026-11-02T14:30:00Z',
    },
  ];

  const mockReviewSummary = {
    businessId: 'biz-123',
    averageRating: 4.7,
    totalReviews: 15,
    fiveStarCount: 10,
    fourStarCount: 3,
    threeStarCount: 2,
    twoStarCount: 0,
    oneStarCount: 0,
  };

  it('renders rating summary, average score, and star distribution correctly', async () => {
    businessService.getBusinessById.mockResolvedValue({
      ...mockBusiness,
      averageRating: 4.7,
      reviewCount: 15,
    });
    businessService.getBusinessReviewSummary.mockResolvedValue(mockReviewSummary);
    businessService.getBusinessReviews.mockResolvedValue({
      content: mockReviews,
      totalPages: 1,
      totalElements: 15,
      number: 0,
    });

    renderComponent('biz-123');

    // Section exists
    const reviewsSection = await screen.findByTestId('business-reviews-section');
    expect(reviewsSection).toBeInTheDocument();

    // Average rating
    expect(screen.getByTestId('average-rating-value')).toHaveTextContent('4.7/5');

    // Total review count
    expect(screen.getByTestId('total-reviews-count')).toHaveTextContent('15 reviews');

    // Header rating badge
    const headerBadge = screen.getByTestId('header-rating-badge');
    expect(headerBadge).toHaveTextContent('4.7');
    expect(headerBadge).toHaveTextContent('(15)');

    // Rating distribution
    const distribution = screen.getByTestId('rating-distribution');
    expect(distribution).toBeInTheDocument();
    expect(distribution).toHaveTextContent('10'); // 5-star count
    expect(distribution).toHaveTextContent('3');  // 4-star count
    expect(distribution).toHaveTextContent('2');  // 3-star count
  });

  it('renders zero-review state gracefully without misleading ratings', async () => {
    businessService.getBusinessById.mockResolvedValue({
      ...mockBusiness,
      averageRating: 0.0,
      reviewCount: 0,
    });
    businessService.getBusinessReviewSummary.mockResolvedValue({
      businessId: 'biz-123',
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
      totalPages: 0,
      totalElements: 0,
      number: 0,
    });

    renderComponent('biz-123');

    await screen.findByTestId('business-reviews-section');

    // Empty state container
    expect(screen.getByTestId('reviews-empty')).toBeInTheDocument();
    expect(screen.getByText(/Be the first to share your experience with Kasi Fresh Cafe!/i)).toBeInTheDocument();

    // Rating summary empty state
    expect(screen.getByTestId('rating-summary-empty')).toBeInTheDocument();
    expect(screen.getAllByText('No reviews yet').length).toBeGreaterThan(0);
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();

    // Ensure no misleading score like "5.0/5" is present
    expect(screen.queryByTestId('average-rating-value')).not.toBeInTheDocument();
  });

  it('renders customer reviews with author name, star rating, comment, and formatted date', async () => {
    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessReviews.mockResolvedValue({
      content: mockReviews,
      totalPages: 1,
      totalElements: 2,
      number: 0,
    });

    renderComponent('biz-123');

    await screen.findByTestId('customer-reviews-list');

    // First review
    const rev1 = screen.getByTestId('review-item-rev-1');
    expect(rev1).toBeInTheDocument();
    expect(rev1).toHaveTextContent('Thabo M.');
    expect(rev1).toHaveTextContent('Best chisa nyama in Soweto!');
    expect(rev1.querySelector('[aria-label="5.0 out of 5 stars"]')).toBeInTheDocument();

    // Second review
    const rev2 = screen.getByTestId('review-item-rev-2');
    expect(rev2).toBeInTheDocument();
    expect(rev2).toHaveTextContent('Lerato K.');
    expect(rev2).toHaveTextContent('Great township experience.');
    expect(rev2.querySelector('[aria-label="4.0 out of 5 stars"]')).toBeInTheDocument();
  });

  it('does not display reviewer private information like email addresses or phone numbers', async () => {
    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessReviews.mockResolvedValue({
      content: [
        {
          id: 'rev-private',
          businessId: 'biz-123',
          rating: 5,
          comment: 'Outstanding township hospitality.',
          authorName: 'Kagiso M.',
          createdAt: '2026-11-03T10:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
    });

    renderComponent('biz-123');

    const reviewItem = await screen.findByTestId('review-item-rev-private');

    // Confirm author name is displayed safely
    expect(reviewItem).toHaveTextContent('Kagiso M.');

    // Ensure no email or phone format appears in review content
    expect(reviewItem).not.toHaveTextContent(/@kasicircle\.co\.za|@gmail\.com|@example\.com/i);
    expect(reviewItem).not.toHaveTextContent(/\+27\d{9}|082\d{7}/);
  });

  it('handles review pagination with Previous and Next buttons', async () => {
    const user = userEvent.setup();
    businessService.getBusinessById.mockResolvedValue(mockBusiness);

    // Initial page 0
    businessService.getBusinessReviews.mockResolvedValueOnce({
      content: [mockReviews[0]],
      totalPages: 2,
      totalElements: 2,
      number: 0,
    });

    renderComponent('biz-123');

    await screen.findByTestId('review-item-rev-1');

    // Pagination controls exist
    expect(screen.getByTestId('reviews-page-indicator')).toHaveTextContent('Page 1 of 2');
    const prevBtn = screen.getByTestId('reviews-prev-page');
    const nextBtn = screen.getByTestId('reviews-next-page');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Prepare page 1 response
    businessService.getBusinessReviews.mockResolvedValueOnce({
      content: [mockReviews[1]],
      totalPages: 2,
      totalElements: 2,
      number: 1,
    });

    // Click Next
    await user.click(nextBtn);

    await waitFor(() => {
      expect(businessService.getBusinessReviews).toHaveBeenCalledWith('biz-123', 1, 10);
    });

    expect(await screen.findByTestId('review-item-rev-2')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-page-indicator')).toHaveTextContent('Page 2 of 2');
    expect(nextBtn).toBeDisabled();
    expect(prevBtn).toBeEnabled();
  });

  it('displays reviews loading spinner while review request is in flight', async () => {
    let resolveReviews;
    const pendingReviewsPromise = new Promise((resolve) => {
      resolveReviews = resolve;
    });

    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessReviews.mockReturnValue(pendingReviewsPromise);

    renderComponent('biz-123');

    expect(await screen.findByTestId('reviews-loading')).toBeInTheDocument();

    resolveReviews({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
    });

    await waitFor(() => {
      expect(screen.queryByTestId('reviews-loading')).not.toBeInTheDocument();
    });
  });

  it('handles reviews API error gracefully and allows user to retry', async () => {
    const user = userEvent.setup();
    businessService.getBusinessById.mockResolvedValue(mockBusiness);
    businessService.getBusinessReviews.mockRejectedValueOnce(new Error('Failed to fetch reviews'));

    renderComponent('biz-123');

    const errorContainer = await screen.findByTestId('reviews-error');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveTextContent(/Failed to load customer reviews/i);

    // Mock successful retry
    businessService.getBusinessReviews.mockResolvedValueOnce({
      content: mockReviews,
      totalPages: 1,
      totalElements: 2,
      number: 0,
    });

    const retryBtn = screen.getByRole('button', { name: /retry reviews/i });
    await user.click(retryBtn);

    expect(await screen.findByTestId('customer-reviews-list')).toBeInTheDocument();
    expect(screen.queryByTestId('reviews-error')).not.toBeInTheDocument();
  });

  it('calls review APIs with correct business ID and default pagination parameters', async () => {
    businessService.getBusinessById.mockResolvedValue(mockBusiness);

    renderComponent('test-biz-uuid-999');

    await waitFor(() => {
      expect(businessService.getBusinessReviews).toHaveBeenCalledWith('test-biz-uuid-999', 0, 10);
      expect(businessService.getBusinessReviewSummary).toHaveBeenCalledWith('test-biz-uuid-999');
    });
  });

  describe('Customer Review Submission & Management', () => {
    const mockCustomerUser = {
      id: 'cust-101',
      firstName: 'Sipho',
      lastName: 'Zulu',
      email: 'sipho@example.com',
      accountType: 'RESIDENT',
    };

    const mockMyReview = {
      id: 'rev-me-1',
      businessId: 'biz-123',
      rating: 4,
      comment: 'Great service and fresh food!',
      authorName: 'Sipho Z.',
      createdAt: '2026-10-15T10:00:00Z',
      updatedAt: '2026-10-15T10:00:00Z',
    };

    it('1. allows authenticated user to open and close the review form', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);

      renderComponent('biz-123');

      const writeBtn = await screen.findByTestId('write-review-btn');
      expect(writeBtn).toBeInTheDocument();

      // Open form
      await user.click(writeBtn);

      const reviewForm = await screen.findByTestId('review-form');
      expect(reviewForm).toBeInTheDocument();
      expect(screen.getByTestId('star-rating-selector')).toBeInTheDocument();
      expect(screen.getByTestId('review-comment-input')).toBeInTheDocument();
      expect(screen.getByTestId('character-counter')).toHaveTextContent('0/1000 characters');
      expect(screen.getByTestId('submit-review-btn')).toBeInTheDocument();

      // Close form
      await user.click(screen.getByTestId('cancel-review-btn'));
      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
    });

    it('2. displays a login prompt for anonymous users without write controls', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);

      renderComponent('biz-123');

      const loginPrompt = await screen.findByTestId('review-login-prompt');
      expect(loginPrompt).toBeInTheDocument();
      expect(loginPrompt).toHaveTextContent(/Please log in to share your review/i);
      expect(screen.queryByTestId('write-review-btn')).not.toBeInTheDocument();

      // Click login button
      const loginBtn = screen.getByTestId('review-login-btn');
      await user.click(loginBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('3. allows user to select a 1-5 star rating in the review form', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);

      renderComponent('biz-123');

      await user.click(await screen.findByTestId('write-review-btn'));

      expect(screen.getByTestId('selected-rating-label')).toHaveTextContent('Select rating');

      // Click star 4
      await user.click(screen.getByTestId('star-select-4'));
      expect(screen.getByTestId('selected-rating-label')).toHaveTextContent('4 of 5 stars');

      // Click star 5
      await user.click(screen.getByTestId('star-select-5'));
      expect(screen.getByTestId('selected-rating-label')).toHaveTextContent('5 of 5 stars');
    });

    it('4. validates that a star rating is selected before submission', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);

      renderComponent('biz-123');

      await user.click(await screen.findByTestId('write-review-btn'));

      // Click submit without choosing stars
      await user.click(screen.getByTestId('submit-review-btn'));

      expect(await screen.findByTestId('review-form-error')).toHaveTextContent(
        /Please select a rating between 1 and 5 stars/i
      );
      expect(businessService.createReview).not.toHaveBeenCalled();
    });

    it('5. allows submitting a review with rating only and optional empty comment', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);
      businessService.createReview.mockResolvedValue({
        id: 'rev-created-1',
        businessId: 'biz-123',
        rating: 5,
        comment: null,
        authorName: 'Sipho Z.',
      });

      renderComponent('biz-123');

      await user.click(await screen.findByTestId('write-review-btn'));

      await user.click(screen.getByTestId('star-select-5'));
      await user.click(screen.getByTestId('submit-review-btn'));

      await waitFor(() => {
        expect(businessService.createReview).toHaveBeenCalledWith('biz-123', {
          rating: 5,
          comment: null,
        });
      });
      expect(await screen.findByTestId('review-success-message')).toBeInTheDocument();
    });

    it('6. validates comment length constraint (maximum 1000 characters)', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);

      renderComponent('biz-123');

      await user.click(await screen.findByTestId('write-review-btn'));
      await user.click(screen.getByTestId('star-select-4'));

      const commentInput = screen.getByTestId('review-comment-input');
      const longComment = 'a'.repeat(1001);
      fireEvent.change(commentInput, { target: { value: longComment } });

      expect(screen.getByTestId('character-counter')).toHaveTextContent('1001/1000 characters');

      await user.click(screen.getByTestId('submit-review-btn'));

      expect(await screen.findByTestId('review-form-error')).toHaveTextContent(
        /cannot exceed 1000 characters/i
      );
      expect(businessService.createReview).not.toHaveBeenCalled();
    });

    it('7. submits a new review successfully with rating and comment', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);
      businessService.createReview.mockResolvedValue({
        id: 'rev-new-1',
        businessId: 'biz-123',
        rating: 5,
        comment: 'Warm welcome and authentic flavours.',
        authorName: 'Sipho Z.',
      });

      renderComponent('biz-123');

      await user.click(await screen.findByTestId('write-review-btn'));
      await user.click(screen.getByTestId('star-select-5'));

      const commentInput = screen.getByTestId('review-comment-input');
      await user.type(commentInput, 'Warm welcome and authentic flavours.');

      await user.click(screen.getByTestId('submit-review-btn'));

      await waitFor(() => {
        expect(businessService.createReview).toHaveBeenCalledWith('biz-123', {
          rating: 5,
          comment: 'Warm welcome and authentic flavours.',
        });
      });

      expect(await screen.findByTestId('review-success-message')).toHaveTextContent(
        /submitted successfully/i
      );
      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
    });

    it('8. handles duplicate review API error and displays message without closing form', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);
      businessService.createReview.mockRejectedValue({
        status: 409,
        message: 'You have already reviewed this business. You can update your existing review.',
      });

      renderComponent('biz-123');

      await user.click(await screen.findByTestId('write-review-btn'));
      await user.click(screen.getByTestId('star-select-4'));
      await user.click(screen.getByTestId('submit-review-btn'));

      const formError = await screen.findByTestId('review-form-error');
      expect(formError).toHaveTextContent(
        /You have already reviewed this business/i
      );
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    it('9. loads existing customer review through /me and displays "Your Review" card', async () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(mockMyReview);

      renderComponent('biz-123');

      expect(await screen.findByTestId('my-review-card')).toBeInTheDocument();
      expect(screen.getByTestId('my-review-comment')).toHaveTextContent('Great service and fresh food!');
      expect(screen.getByTestId('edit-review-btn')).toBeInTheDocument();
      expect(screen.getByTestId('delete-review-btn')).toBeInTheDocument();
      // Write review button is not shown when user already reviewed
      expect(screen.queryByTestId('write-review-btn')).not.toBeInTheDocument();
    });

    it('10. allows user to edit their existing review with prepopulated values', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(mockMyReview);
      businessService.updateReview.mockResolvedValue({
        ...mockMyReview,
        rating: 5,
        comment: 'Updated: absolutely superb experience!',
      });

      renderComponent('biz-123');

      await screen.findByTestId('my-review-card');

      // Click Edit
      await user.click(screen.getByTestId('edit-review-btn'));

      // Form opens pre-populated
      expect(await screen.findByTestId('review-form')).toBeInTheDocument();
      expect(screen.getByTestId('selected-rating-label')).toHaveTextContent('4 of 5 stars');
      expect(screen.getByTestId('review-comment-input')).toHaveValue('Great service and fresh food!');

      // Update values
      await user.click(screen.getByTestId('star-select-5'));
      const commentInput = screen.getByTestId('review-comment-input');
      await user.clear(commentInput);
      await user.type(commentInput, 'Updated: absolutely superb experience!');

      await user.click(screen.getByTestId('submit-review-btn'));

      await waitFor(() => {
        expect(businessService.updateReview).toHaveBeenCalledWith('biz-123', 'rev-me-1', {
          rating: 5,
          comment: 'Updated: absolutely superb experience!',
        });
      });

      expect(await screen.findByTestId('review-success-message')).toHaveTextContent(
        /updated successfully/i
      );
    });

    it('11. allows user to delete existing review after confirmation dialog', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(mockMyReview);
      businessService.deleteReview.mockResolvedValue(null);

      renderComponent('biz-123');

      await screen.findByTestId('my-review-card');

      // Open Delete Dialog
      await user.click(screen.getByTestId('delete-review-btn'));

      const dialog = await screen.findByTestId('delete-review-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveTextContent(/Are you sure you want to delete your review/i);

      // Cancel first
      await user.click(screen.getByTestId('cancel-delete-review-btn'));
      expect(screen.queryByTestId('delete-review-dialog')).not.toBeInTheDocument();
      expect(businessService.deleteReview).not.toHaveBeenCalled();

      // Open Delete Dialog again and confirm
      await user.click(screen.getByTestId('delete-review-btn'));
      await user.click(screen.getByTestId('confirm-delete-review-btn'));

      await waitFor(() => {
        expect(businessService.deleteReview).toHaveBeenCalledWith('biz-123', 'rev-me-1');
      });

      expect(await screen.findByTestId('review-success-message')).toHaveTextContent(
        /deleted/i
      );
      expect(screen.queryByTestId('my-review-card')).not.toBeInTheDocument();
    });

    it('12. ensures another customer review does not expose edit or delete controls', async () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);
      businessService.getBusinessReviews.mockResolvedValue({
        content: [
          {
            id: 'rev-other-99',
            businessId: 'biz-123',
            rating: 5,
            comment: 'Review by someone else.',
            authorName: 'Lerato K.',
            createdAt: '2026-10-10T10:00:00Z',
          },
        ],
        totalPages: 1,
        totalElements: 1,
        number: 0,
      });

      renderComponent('biz-123');

      const otherReviewItem = await screen.findByTestId('review-item-rev-other-99');
      expect(otherReviewItem).toBeInTheDocument();

      // Confirm no edit/delete buttons exist inside other user's review
      expect(within(otherReviewItem).queryByTestId('edit-review-btn')).not.toBeInTheDocument();
      expect(within(otherReviewItem).queryByTestId('delete-review-btn')).not.toBeInTheDocument();
      expect(within(otherReviewItem).queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(within(otherReviewItem).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('13. prevents business owners from reviewing their own business', async () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'owner-1', accountType: 'BUSINESS' }, // Matches mockBusiness.ownerId
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);

      renderComponent('biz-123');

      await screen.findByRole('heading', { level: 1, name: 'Kasi Fresh Cafe' });

      // Neither write review button nor review form should be rendered
      expect(screen.queryByTestId('write-review-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('review-login-prompt')).not.toBeInTheDocument();
      expect(businessService.getMyReview).not.toHaveBeenCalled();
    });

    it('14. refreshes reviews list, rating summary and business info after review mutation', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(null);
      businessService.createReview.mockResolvedValue({
        id: 'rev-10',
        businessId: 'biz-123',
        rating: 5,
        comment: 'Fresh & tasty',
        authorName: 'Sipho Z.',
      });

      renderComponent('biz-123');

      // Clear call counts from initial mount
      await screen.findByTestId('write-review-btn');
      businessService.getBusinessReviews.mockClear();
      businessService.getBusinessReviewSummary.mockClear();
      businessService.getBusinessById.mockClear();

      // Submit review
      await user.click(screen.getByTestId('write-review-btn'));
      await user.click(screen.getByTestId('star-select-5'));
      await user.click(screen.getByTestId('submit-review-btn'));

      await waitFor(() => {
        expect(businessService.createReview).toHaveBeenCalled();
        expect(businessService.getBusinessReviews).toHaveBeenCalled();
        expect(businessService.getBusinessReviewSummary).toHaveBeenCalled();
        expect(businessService.getBusinessById).toHaveBeenCalled();
      });
    });

    it('15. handles loading and error states during submission and deletion', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockCustomerUser,
        isLoading: false,
      });
      businessService.getBusinessById.mockResolvedValue(mockBusiness);
      businessService.getMyReview.mockResolvedValue(mockMyReview);

      // Delete error handling
      businessService.deleteReview.mockRejectedValueOnce(new Error('Network error deleting review'));

      renderComponent('biz-123');

      await screen.findByTestId('my-review-card');
      await user.click(screen.getByTestId('delete-review-btn'));

      await user.click(screen.getByTestId('confirm-delete-review-btn'));

      expect(await screen.findByTestId('delete-review-error')).toHaveTextContent(
        /Network error deleting review/i
      );
      // Dialog remains open
      expect(screen.getByTestId('delete-review-dialog')).toBeInTheDocument();
    });
  });
});
