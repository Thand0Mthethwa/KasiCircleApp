import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Explore from './Explore';
import { businessService } from '../services/api';

// Mock businessService
vi.mock('../services/api', () => ({
  businessService: {
    getAllBusinesses: vi.fn(),
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

describe('Explore (Public Business Directory) Page', () => {
  const mockBusinesses = [
    {
      id: 'biz-1',
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
      averageRating: 4.5,
      reviewCount: 12,
    },
    {
      id: 'biz-2',
      name: 'Mamelodi Motors',
      category: 'Automotive',
      description: 'Reliable vehicle repairs and panel beating in Pretoria.',
      phoneNumber: '+27833334444',
      email: 'service@mamelodimotors.co.za',
      address: '12 Tsamaya Road',
      city: 'Mamelodi',
      province: 'Gauteng',
      ownerId: 'owner-2',
      createdAt: '2026-10-15T12:00:00Z',
      averageRating: 0.0,
      reviewCount: 0,
    },
  ];

  const mockPagedResponse = {
    content: mockBusinesses,
    pageable: { pageNumber: 0, pageSize: 8 },
    totalPages: 2,
    totalElements: 10,
    last: false,
    first: true,
  };

  const emptyPagedResponse = {
    content: [],
    pageable: { pageNumber: 0, pageSize: 8 },
    totalPages: 0,
    totalElements: 0,
    last: true,
    first: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (initialEntries = ['/explore']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Explore />
      </MemoryRouter>
    );

  it('renders directory page and fetches businesses on initial load', async () => {
    businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

    renderComponent();

    // Directory title & inputs
    expect(screen.getByRole('heading', { name: 'Find businesses near you.' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search businesses by name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/filter by township\/city/i)).toBeInTheDocument();

    // Verify initial API call
    await waitFor(() => {
      expect(businessService.getAllBusinesses).toHaveBeenCalledWith({
        page: 0,
        size: 8,
        search: '',
        category: '',
        city: '',
      });
    });

    // Verify rendered business cards
    expect(await screen.findByText('Kasi Fresh Cafe')).toBeInTheDocument();
    expect(screen.getByText('Mamelodi Motors')).toBeInTheDocument();
    expect(screen.getByText('Soweto, Gauteng')).toBeInTheDocument();
    expect(screen.getByText(/10 businesses listed/i)).toBeInTheDocument();
  });

  it('searches businesses by name when submitting search input', async () => {
    const user = userEvent.setup();
    businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search businesses by name/i);
    await user.clear(searchInput);
    await user.type(searchInput, 'Kasi Fresh');

    const searchBtn = screen.getByRole('button', { name: /^search$/i });
    await user.click(searchBtn);

    await waitFor(() => {
      expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({
        page: 0,
        size: 8,
        search: 'Kasi Fresh',
        category: '',
        city: '',
      });
    });
  });

  it('filters businesses by category when category pill is selected', async () => {
    const user = userEvent.setup();
    businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    // Select Food & Beverage pill
    const foodCategoryBtn = screen.getByRole('button', { name: 'Food & Beverage' });
    await user.click(foodCategoryBtn);

    await waitFor(() => {
      expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({
        page: 0,
        size: 8,
        search: '',
        category: 'Food & Beverage',
        city: '',
      });
    });
  });

  it('filters businesses by city/township', async () => {
    const user = userEvent.setup();
    businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    const cityInput = screen.getByPlaceholderText(/filter by township\/city/i);
    await user.clear(cityInput);
    await user.type(cityInput, 'Soweto');

    const searchBtn = screen.getByRole('button', { name: /^search$/i });
    await user.click(searchBtn);

    await waitFor(() => {
      expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({
        page: 0,
        size: 8,
        search: '',
        category: '',
        city: 'Soweto',
      });
    });
  });

  it('combines name search, category filter, and city filter', async () => {
    const user = userEvent.setup();
    businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    // Type search
    const searchInput = screen.getByPlaceholderText(/search businesses by name/i);
    await user.type(searchInput, 'Cafe');

    // Type city
    const cityInput = screen.getByPlaceholderText(/filter by township\/city/i);
    await user.type(cityInput, 'Soweto');

    // Select category
    const foodCategoryBtn = screen.getByRole('button', { name: 'Food & Beverage' });
    await user.click(foodCategoryBtn);

    // Submit form
    const searchBtn = screen.getByRole('button', { name: /^search$/i });
    await user.click(searchBtn);

    await waitFor(() => {
      expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({
        page: 0,
        size: 8,
        search: 'Cafe',
        category: 'Food & Beverage',
        city: 'Soweto',
      });
    });
  });

  it('resets all filters when clicking Reset button', async () => {
    const user = userEvent.setup();
    businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    // Apply a search
    const searchInput = screen.getByPlaceholderText(/search businesses by name/i);
    await user.type(searchInput, 'Cafe');
    const searchBtn = screen.getByRole('button', { name: /^search$/i });
    await user.click(searchBtn);

    // Find and click reset button
    const resetBtn = await screen.findByRole('button', { name: /reset all filters/i });
    await user.click(resetBtn);

    await waitFor(() => {
      expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({
        page: 0,
        size: 8,
        search: '',
        category: '',
        city: '',
      });
    });
  });

  it('displays empty state when no businesses match', async () => {
    businessService.getAllBusinesses.mockResolvedValue(emptyPagedResponse);

    renderComponent();

    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No businesses found')).toBeInTheDocument();
  });

  it('displays error state and retries on failure', async () => {
    const user = userEvent.setup();
    businessService.getAllBusinesses.mockRejectedValueOnce(
      new Error('Failed to connect to backend server')
    );

    renderComponent();

    expect(await screen.findByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Failed to load businesses')).toBeInTheDocument();
    expect(screen.getByText('Failed to connect to backend server')).toBeInTheDocument();

    // Mock success on retry
    businessService.getAllBusinesses.mockResolvedValueOnce(mockPagedResponse);

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    expect(await screen.findByText('Kasi Fresh Cafe')).toBeInTheDocument();
  });

  it('handles pagination next and previous controls', async () => {
    const user = userEvent.setup();
    businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    const nextBtn = screen.getByRole('button', { name: /next page/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click Next
    await user.click(nextBtn);

    await waitFor(() => {
      expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({
        page: 1,
        size: 8,
        search: '',
        category: '',
        city: '',
      });
    });
  });

  it('navigates to dedicated business detail page when clicking View Details', async () => {
    const user = userEvent.setup();
    businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kasi Fresh Cafe')).toBeInTheDocument();
    });

    // Click View Details for Kasi Fresh Cafe (biz-1)
    const viewDetailsButtons = screen.getAllByRole('link', { name: /view details/i });
    await user.click(viewDetailsButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/businesses/biz-1');
  });

  describe('Business Rating Badges', () => {
    it('displays rating and review count for a business with multiple reviews', async () => {
      const ratedBusiness = {
        ...mockBusinesses[0],
        averageRating: 4.5,
        reviewCount: 12,
      };
      businessService.getAllBusinesses.mockResolvedValue({
        ...mockPagedResponse,
        content: [ratedBusiness],
        totalElements: 1,
      });

      renderComponent();

      const ratingBadge = await screen.findByTestId('business-rating-biz-1');
      expect(ratingBadge).toBeInTheDocument();
      expect(ratingBadge).toHaveTextContent('4.5');
      expect(ratingBadge).toHaveTextContent('(12 reviews)');
    });

    it('displays singular "review" for a business with exactly one review', async () => {
      const singleReviewBiz = {
        ...mockBusinesses[0],
        id: 'biz-single',
        averageRating: 5.0,
        reviewCount: 1,
      };
      businessService.getAllBusinesses.mockResolvedValue({
        ...mockPagedResponse,
        content: [singleReviewBiz],
        totalElements: 1,
      });

      renderComponent();

      const ratingBadge = await screen.findByTestId('business-rating-biz-single');
      expect(ratingBadge).toHaveTextContent('5.0');
      expect(ratingBadge).toHaveTextContent('(1 review)');
      expect(ratingBadge).not.toHaveTextContent('reviews');
    });

    it('displays "No reviews yet" for a business with no reviews', async () => {
      const noReviewsBiz = {
        ...mockBusinesses[1],
        averageRating: 0.0,
        reviewCount: 0,
      };
      businessService.getAllBusinesses.mockResolvedValue({
        ...mockPagedResponse,
        content: [noReviewsBiz],
        totalElements: 1,
      });

      renderComponent();

      const ratingBadge = await screen.findByTestId('business-rating-biz-2');
      expect(ratingBadge).toHaveTextContent('No reviews yet');
      expect(ratingBadge).not.toHaveTextContent('4.');
    });

    it('displays different rating badges for businesses with different ratings', async () => {
      businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

      renderComponent();

      // biz-1 has averageRating=4.5, reviewCount=12
      const badge1 = await screen.findByTestId('business-rating-biz-1');
      expect(badge1).toHaveTextContent('4.5');
      expect(badge1).toHaveTextContent('(12 reviews)');

      // biz-2 has averageRating=0.0, reviewCount=0
      const badge2 = screen.getByTestId('business-rating-biz-2');
      expect(badge2).toHaveTextContent('No reviews yet');
    });

    it('handles missing or null rating fields without crashing', async () => {
      const nullFieldsBiz = {
        ...mockBusinesses[0],
        id: 'biz-null',
        averageRating: null,
        reviewCount: null,
      };
      const undefinedFieldsBiz = {
        ...mockBusinesses[1],
        id: 'biz-undef',
      };
      // Remove rating fields entirely
      delete undefinedFieldsBiz.averageRating;
      delete undefinedFieldsBiz.reviewCount;

      businessService.getAllBusinesses.mockResolvedValue({
        ...mockPagedResponse,
        content: [nullFieldsBiz, undefinedFieldsBiz],
        totalElements: 2,
      });

      renderComponent();

      const badge1 = await screen.findByTestId('business-rating-biz-null');
      expect(badge1).toHaveTextContent('No reviews yet');

      const badge2 = screen.getByTestId('business-rating-biz-undef');
      expect(badge2).toHaveTextContent('No reviews yet');
    });

    it('preserves existing search, filter, and pagination functionality with ratings', async () => {
      const user = userEvent.setup();
      businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

      renderComponent();

      await screen.findByTestId('business-rating-biz-1');

      // Search still works
      const searchInput = screen.getByPlaceholderText(/search businesses by name/i);
      await user.type(searchInput, 'Cafe');
      const searchBtn = screen.getByRole('button', { name: /^search$/i });
      await user.click(searchBtn);

      await waitFor(() => {
        expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith({
          page: 0,
          size: 8,
          search: 'Cafe',
          category: '',
          city: '',
        });
      });

      // Category filter still works
      const foodCategoryBtn = screen.getByRole('button', { name: 'Food & Beverage' });
      await user.click(foodCategoryBtn);

      await waitFor(() => {
        expect(businessService.getAllBusinesses).toHaveBeenLastCalledWith(
          expect.objectContaining({
            category: 'Food & Beverage',
          })
        );
      });
    });

    it('does not make per-business review API requests from the Explore page', async () => {
      businessService.getAllBusinesses.mockResolvedValue(mockPagedResponse);

      renderComponent();

      await screen.findByTestId('business-cards-list');

      // Only getAllBusinesses should have been called
      expect(businessService.getAllBusinesses).toHaveBeenCalled();

      // No individual review API calls should exist on the mock
      expect(businessService.getBusinessReviews).toBeUndefined();
      expect(businessService.getBusinessReviewSummary).toBeUndefined();
    });
  });
});

