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
    getBusinessImages: vi.fn(),
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
    businessService.getBusinessImages.mockResolvedValue([]);
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
    expect(screen.getByText('Township Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Verified Business Listing')).toBeInTheDocument();

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
});
