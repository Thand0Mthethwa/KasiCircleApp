import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusinessProfile from './BusinessProfile';
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
    createBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    getBusinessImages: vi.fn(),
    uploadBusinessImage: vi.fn(),
    setCoverImage: vi.fn(),
    deleteBusinessImage: vi.fn(),
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

describe('BusinessProfile Page', () => {
  const businessUser = {
    id: 'user-biz-1',
    firstName: 'Bongani',
    lastName: 'Zulu',
    email: 'bongani@biz.co.za',
    accountType: 'BUSINESS',
  };

  const residentUser = {
    id: 'user-res-1',
    firstName: 'Nomsa',
    lastName: 'Dlamini',
    email: 'nomsa@example.com',
    accountType: 'RESIDENT',
  };

  const workerUser = {
    id: 'user-wrk-1',
    firstName: 'Sipho',
    lastName: 'Khoza',
    email: 'sipho@work.co.za',
    accountType: 'WORKER',
  };

  const mockExistingBusiness = {
    id: 'biz-123',
    name: 'Kasi Fresh Cafe',
    category: 'Food & Beverage',
    description: 'Serving delicious township meals and refreshments daily.',
    phoneNumber: '+27821112222',
    email: 'info@kasifresh.co.za',
    address: '45 Vilakazi Street',
    city: 'Soweto',
    province: 'Gauteng',
    ownerId: 'user-biz-1',
    createdAt: '2026-10-01T10:00:00Z',
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    businessService.getBusinessImages.mockResolvedValue([]);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BusinessProfile />
      </BrowserRouter>
    );

  it('renders creation experience for BUSINESS account with no existing business', async () => {
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
    });

    renderComponent();

    // Verify loading finishes and creation form renders
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Register Your Business' })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Physical Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Township \/ City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Province/i)).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Create Business Profile' })
    ).toBeInTheDocument();
  });

  it('restricts RESIDENT account and does not show creation form', async () => {
    useAuth.mockReturnValue({
      user: residentUser,
      isLoading: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Business Account Required')).toBeInTheDocument();
    });

    expect(screen.getByText(/exclusively available for accounts registered with the/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Business Name/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create Business Profile' })).not.toBeInTheDocument();
  });

  it('restricts WORKER account and does not show creation form', async () => {
    useAuth.mockReturnValue({
      user: workerUser,
      isLoading: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Business Account Required')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Business Name/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create Business Profile' })).not.toBeInTheDocument();
  });

  it('validates required fields and shows validation errors without calling API', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Business Profile' })).toBeInTheDocument();
    });

    // Submit empty form
    await user.click(screen.getByRole('button', { name: 'Create Business Profile' }));

    expect(screen.getByText('Business name is required')).toBeInTheDocument();
    expect(screen.getByText('Business description is required')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    expect(screen.getByText('Business email is required')).toBeInTheDocument();
    expect(screen.queryByText('Address must not exceed 255 characters')).not.toBeInTheDocument();
    expect(screen.getByText('Street address is required')).toBeInTheDocument();
    expect(screen.getByText('Township or city is required')).toBeInTheDocument();

    expect(businessService.createBusiness).not.toHaveBeenCalled();
  });

  it('creates business profile successfully and displays saved listing', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
    });

    const newBusiness = {
      id: 'biz-new-1',
      name: 'Orlando Hardware',
      category: 'Construction & Hardware',
      description: 'Quality building supplies and tools in Soweto.',
      phoneNumber: '+27829990000',
      email: 'sales@orlandohardware.co.za',
      address: '100 Mooki Street',
      city: 'Orlando',
      province: 'Gauteng',
      ownerId: businessUser.id,
      createdAt: '2026-11-02T12:00:00Z',
    };
    businessService.createBusiness.mockResolvedValueOnce(newBusiness);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { name: 'name', value: 'Orlando Hardware' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { name: 'category', value: 'Construction & Hardware' } });
    fireEvent.change(screen.getByLabelText(/Business Description/i), { target: { name: 'description', value: 'Quality building supplies and tools in Soweto.' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { name: 'phoneNumber', value: '0829990000' } });
    fireEvent.change(screen.getByLabelText(/Business Email/i), { target: { name: 'email', value: 'sales@orlandohardware.co.za' } });
    fireEvent.change(screen.getByLabelText(/Physical Address/i), { target: { name: 'address', value: '100 Mooki Street' } });
    fireEvent.change(screen.getByLabelText(/Township \/ City/i), { target: { name: 'city', value: 'Orlando' } });
    fireEvent.change(screen.getByLabelText(/Province/i), { target: { name: 'province', value: 'Gauteng' } });

    await user.click(screen.getByRole('button', { name: 'Create Business Profile' }));

    await waitFor(() => {
      expect(screen.getByText('Business profile created successfully!')).toBeInTheDocument();
    });

    // Check that saved profile view is rendered and creation form is gone
    expect(screen.getByRole('heading', { name: 'Orlando Hardware' })).toBeInTheDocument();
    expect(screen.getByText('Construction & Hardware')).toBeInTheDocument();
    expect(screen.getByText('+27829990000')).toBeInTheDocument();
    expect(screen.getByText('sales@orlandohardware.co.za')).toBeInTheDocument();
    expect(screen.getByText('100 Mooki Street, Orlando, Gauteng')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Register Your Business' })).not.toBeInTheDocument();
  });

  it('displays API conflict error clearly when account already has a business', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses
      .mockResolvedValueOnce({
        content: [],
        totalElements: 0,
      })
      .mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });

    const conflictError = new Error('Conflict');
    conflictError.status = 409;
    conflictError.data = { status: 409, message: 'A business listing already exists for this account.' };
    businessService.createBusiness.mockRejectedValueOnce(conflictError);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { name: 'name', value: 'Duplicate Business' } });
    fireEvent.change(screen.getByLabelText(/Business Description/i), { target: { name: 'description', value: 'Some description' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { name: 'phoneNumber', value: '+27821112222' } });
    fireEvent.change(screen.getByLabelText(/Business Email/i), { target: { name: 'email', value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Physical Address/i), { target: { name: 'address', value: '123 Street' } });
    fireEvent.change(screen.getByLabelText(/Township \/ City/i), { target: { name: 'city', value: 'Soweto' } });

    await user.click(screen.getByRole('button', { name: 'Create Business Profile' }));

    await waitFor(() => {
      expect(screen.getByText('A business listing already exists for this account.')).toBeInTheDocument();
    });
  });

  it('prevents duplicate submissions while a request is in flight', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
    });

    let resolvePromise;
    businessService.createBusiness.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { name: 'name', value: 'Busy Cafe' } });
    fireEvent.change(screen.getByLabelText(/Business Description/i), { target: { name: 'description', value: 'Great township coffee and muffins.' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { name: 'phoneNumber', value: '+27821113333' } });
    fireEvent.change(screen.getByLabelText(/Business Email/i), { target: { name: 'email', value: 'busy@cafe.co.za' } });
    fireEvent.change(screen.getByLabelText(/Physical Address/i), { target: { name: 'address', value: '50 Main Road' } });
    fireEvent.change(screen.getByLabelText(/Township \/ City/i), { target: { name: 'city', value: 'Diepkloof' } });

    const submitButton = screen.getByRole('button', { name: 'Create Business Profile' });
    await user.click(submitButton);

    // Verify button shows loading state and is disabled
    expect(screen.getByText('Creating Business Profile...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Try clicking again while disabled
    await user.click(submitButton);
    expect(businessService.createBusiness).toHaveBeenCalledTimes(1);

    // Resolve request
    resolvePromise({
      id: 'biz-busy-1',
      name: 'Busy Cafe',
      category: 'Retail',
      description: 'Great township coffee and muffins.',
      phoneNumber: '+27821113333',
      email: 'busy@cafe.co.za',
      address: '50 Main Road',
      city: 'Diepkloof',
      province: 'Gauteng',
      ownerId: businessUser.id,
    });

    await waitFor(() => {
      expect(screen.getByText('Business profile created successfully!')).toBeInTheDocument();
    });
  });

  it('displays existing listing directly when account already has a business', async () => {
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockExistingBusiness],
      totalElements: 1,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('existing-business-view')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Kasi Fresh Cafe' })).toBeInTheDocument();
    expect(screen.getByText('Food & Beverage')).toBeInTheDocument();
    expect(screen.getByText('Serving delicious township meals and refreshments daily.')).toBeInTheDocument();
    expect(screen.getByText('+27821112222')).toBeInTheDocument();
    expect(screen.getByText('info@kasifresh.co.za')).toBeInTheDocument();
    expect(screen.getByText('45 Vilakazi Street, Soweto, Gauteng')).toBeInTheDocument();
    expect(screen.getByText(/1 of 1 listing used/i)).toBeInTheDocument();

    // Confirm that the creation form is NOT displayed
    expect(screen.queryByTestId('business-create-form')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create Business Profile' })).not.toBeInTheDocument();
  });

  it('opens populated edit form when clicking Edit Business Profile button', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockExistingBusiness],
      totalElements: 1,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('existing-business-view')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit business profile/i });
    await user.click(editButton);

    // Form is displayed
    expect(await screen.findByTestId('business-edit-form')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit Business Listing' })).toBeInTheDocument();

    // Fields are pre-populated with existing business data
    expect(screen.getByLabelText(/Business Name/i)).toHaveValue('Kasi Fresh Cafe');
    expect(screen.getByLabelText(/Category/i)).toHaveValue('Food & Beverage');
    expect(screen.getByLabelText(/Business Description/i)).toHaveValue(
      'Serving delicious township meals and refreshments daily.'
    );
    expect(screen.getByLabelText(/Phone Number/i)).toHaveValue('+27821112222');
    expect(screen.getByLabelText(/Business Email/i)).toHaveValue('info@kasifresh.co.za');
    expect(screen.getByLabelText(/Physical Address/i)).toHaveValue('45 Vilakazi Street');
    expect(screen.getByLabelText(/Township \/ City/i)).toHaveValue('Soweto');
    expect(screen.getByLabelText(/Province/i)).toHaveValue('Gauteng');

    // Save and Cancel buttons are available
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('cancels editing, discards unsaved changes, and returns to existing view', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockExistingBusiness],
      totalElements: 1,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('existing-business-view')).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: /edit business profile/i }));

    const nameInput = screen.getByLabelText(/Business Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Unsaved Modified Name');

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    // Edit form is closed, original view is restored
    expect(await screen.findByTestId('existing-business-view')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kasi Fresh Cafe' })).toBeInTheDocument();
    expect(screen.queryByText('Unsaved Modified Name')).not.toBeInTheDocument();
    expect(businessService.updateBusiness).not.toHaveBeenCalled();
  });

  it('validates required fields when editing and prevents update request', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockExistingBusiness],
      totalElements: 1,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('existing-business-view')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit business profile/i }));

    // Clear required fields
    const nameInput = screen.getByLabelText(/Business Name/i);
    await user.clear(nameInput);
    const emailInput = screen.getByLabelText(/Business Email/i);
    await user.clear(emailInput);

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    // Validation errors show up
    expect(await screen.findByText('Business name is required')).toBeInTheDocument();
    expect(screen.getByText('Business email is required')).toBeInTheDocument();
    expect(businessService.updateBusiness).not.toHaveBeenCalled();
  });

  it('updates business listing successfully and displays updated information', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockExistingBusiness],
      totalElements: 1,
    });

    const updatedResponse = {
      ...mockExistingBusiness,
      name: 'Kasi Gourmet Cafe',
      description: 'Upgraded menu with artisan township dishes.',
      city: 'Johannesburg',
    };
    businessService.updateBusiness.mockResolvedValueOnce(updatedResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('existing-business-view')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit business profile/i }));

    // Modify fields
    const nameInput = screen.getByLabelText(/Business Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Kasi Gourmet Cafe');

    const descInput = screen.getByLabelText(/Business Description/i);
    await user.clear(descInput);
    await user.type(descInput, 'Upgraded menu with artisan township dishes.');

    const cityInput = screen.getByLabelText(/Township \/ City/i);
    await user.clear(cityInput);
    await user.type(cityInput, 'Johannesburg');

    // Save
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(businessService.updateBusiness).toHaveBeenCalledWith(
        'biz-123',
        expect.objectContaining({
          name: 'Kasi Gourmet Cafe',
          description: 'Upgraded menu with artisan township dishes.',
          city: 'Johannesburg',
        })
      );
    });

    // Success message and updated view are displayed
    expect(await screen.findByText('Business profile updated successfully!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kasi Gourmet Cafe' })).toBeInTheDocument();
    expect(screen.getByText('Upgraded menu with artisan township dishes.')).toBeInTheDocument();
    expect(screen.getByText(/45 Vilakazi Street, Johannesburg, Gauteng/i)).toBeInTheDocument();
    expect(screen.queryByTestId('business-edit-form')).not.toBeInTheDocument();
  });

  it('displays API error when business update fails', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockExistingBusiness],
      totalElements: 1,
    });
    businessService.updateBusiness.mockRejectedValueOnce({
      status: 400,
      data: { message: 'Invalid phone number format provided.' },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('existing-business-view')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit business profile/i }));

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Invalid phone number format provided.')).toBeInTheDocument();
    expect(screen.getByTestId('business-edit-form')).toBeInTheDocument();
  });

  it('prevents duplicate submissions while saving edit changes', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockExistingBusiness],
      totalElements: 1,
    });

    let resolveUpdate;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    businessService.updateBusiness.mockReturnValueOnce(updatePromise);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('existing-business-view')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit business profile/i }));

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(saveButton);

    expect(screen.getByText('Saving Changes...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Attempt second click
    await user.click(saveButton);
    expect(businessService.updateBusiness).toHaveBeenCalledTimes(1);

    // Resolve update
    resolveUpdate({
      ...mockExistingBusiness,
      name: 'Resolved Cafe',
    });

    await waitFor(() => {
      expect(screen.getByText('Business profile updated successfully!')).toBeInTheDocument();
    });
  });

  it('navigates to public business page when clicking View Public Page', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: businessUser,
      isLoading: false,
    });
    businessService.getMyBusinesses.mockResolvedValueOnce({
      content: [mockExistingBusiness],
      totalElements: 1,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('existing-business-view')).toBeInTheDocument();
    });

    const viewPublicButton = screen.getByRole('button', { name: /view public page/i });
    await user.click(viewPublicButton);

    expect(mockNavigate).toHaveBeenCalledWith('/businesses/biz-123');
  });

  describe('Business Owner Image Management', () => {
    it('allows BUSINESS owner to see image management controls', async () => {
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockResolvedValueOnce(mockImages);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('business-images-card')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: /photos & gallery/i })).toBeInTheDocument();
      expect(screen.getByTestId('image-quota-counter')).toHaveTextContent('2/10 photos');
      expect(screen.getByTestId('upload-photo-btn')).toBeInTheDocument();
      expect(screen.getByTestId('owner-image-grid')).toBeInTheDocument();
    });

    it('prevents non-BUSINESS users from accessing image management controls', async () => {
      // Resident account
      useAuth.mockReturnValue({
        user: residentUser,
        isLoading: false,
      });

      renderComponent();

      expect(await screen.findByRole('heading', { name: 'Business Account Required' })).toBeInTheDocument();
      expect(screen.queryByTestId('business-images-card')).not.toBeInTheDocument();
      expect(businessService.getBusinessImages).not.toHaveBeenCalled();

      // Worker account
      useAuth.mockReturnValue({
        user: workerUser,
        isLoading: false,
      });

      renderComponent();
      expect(screen.queryByTestId('business-images-card')).not.toBeInTheDocument();
    });

    it('loads and displays existing photos with cover photo badge and controls', async () => {
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockResolvedValueOnce(mockImages);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('owner-image-grid')).toBeInTheDocument();
      });

      // Both images rendered
      expect(screen.getByTestId('owner-image-card-img-1')).toBeInTheDocument();
      expect(screen.getByTestId('owner-image-card-img-2')).toBeInTheDocument();

      // Cover badge on image 1
      expect(screen.getByTestId('cover-badge-img-1')).toBeInTheDocument();
      expect(screen.getByTestId('current-cover-indicator-img-1')).toHaveTextContent('Current Cover');

      // Make Cover button available on non-cover image 2
      expect(screen.getByTestId('set-cover-img-2')).toBeInTheDocument();

      // Delete buttons available on both
      expect(screen.getByTestId('delete-image-img-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-image-img-2')).toBeInTheDocument();
    });

    it('displays empty gallery state when no photos exist', async () => {
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockResolvedValueOnce([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('images-empty')).toBeInTheDocument();
      });

      expect(screen.getByText('No photos uploaded yet')).toBeInTheDocument();
      expect(screen.getByTestId('image-quota-counter')).toHaveTextContent('0/10 photos');
      expect(screen.queryByTestId('owner-image-grid')).not.toBeInTheDocument();
    });

    it('uploads an image successfully and refreshes the gallery', async () => {
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockResolvedValueOnce([mockImages[0]]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('business-images-card')).toBeInTheDocument();
      });

      const newUploadedImage = {
        id: 'img-new',
        businessId: 'biz-123',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/new.jpg',
        isCover: false,
        fileName: 'brand-new.jpg',
      };

      businessService.uploadBusinessImage.mockResolvedValueOnce(newUploadedImage);
      businessService.getBusinessImages.mockResolvedValueOnce([mockImages[0], newUploadedImage]);

      const file = new File(['dummy-content'], 'brand-new.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('photo-upload-input');
      await fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(businessService.uploadBusinessImage).toHaveBeenCalledWith('biz-123', file, false);
      });

      expect(await screen.findByText('Photo uploaded successfully!')).toBeInTheDocument();
      expect(businessService.getBusinessImages).toHaveBeenCalledTimes(2);
    });

    it('validates file size and format before upload and displays backend errors', async () => {
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockResolvedValueOnce([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('business-images-card')).toBeInTheDocument();
      });

      const fileInput = screen.getByTestId('photo-upload-input');

      // 1. Oversized file (> 5MB)
      const oversizedFile = new File(['x'.repeat(100)], 'huge.jpg', { type: 'image/jpeg' });
      Object.defineProperty(oversizedFile, 'size', { value: 6 * 1024 * 1024 });
      await fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

      expect(await screen.findByText(/exceeds the 5MB limit/i)).toBeInTheDocument();
      expect(businessService.uploadBusinessImage).not.toHaveBeenCalled();

      // 2. Invalid format (.pdf)
      const invalidFile = new File(['%PDF'], 'document.pdf', { type: 'application/pdf' });
      await fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(await screen.findByText(/Invalid image format/i)).toBeInTheDocument();
      expect(businessService.uploadBusinessImage).not.toHaveBeenCalled();

      // 3. Backend error handling
      businessService.uploadBusinessImage.mockRejectedValueOnce(new Error('Cloud storage failure'));
      const validFile = new File(['image-bytes'], 'valid.png', { type: 'image/png' });
      await fireEvent.change(fileInput, { target: { files: [validFile] } });

      expect(await screen.findByText('Cloud storage failure')).toBeInTheDocument();
    });

    it('sets a new cover photo and prevents duplicate requests when already cover', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockResolvedValueOnce(mockImages);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('owner-image-grid')).toBeInTheDocument();
      });

      businessService.setCoverImage.mockResolvedValueOnce({
        ...mockImages[1],
        isCover: true,
      });
      businessService.getBusinessImages.mockResolvedValueOnce([
        { ...mockImages[1], isCover: true },
        { ...mockImages[0], isCover: false },
      ]);

      const setCoverBtn = screen.getByTestId('set-cover-img-2');
      await user.click(setCoverBtn);

      expect(businessService.setCoverImage).toHaveBeenCalledWith('biz-123', 'img-2');
      expect(await screen.findByText('Cover photo updated successfully!')).toBeInTheDocument();

      // Verified image 2 is now the cover and does not have a "Make Cover" button
      expect(screen.queryByTestId('set-cover-img-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('current-cover-indicator-img-2')).toHaveTextContent('Current Cover');
    });

    it('deletes an image after confirmation and refreshes the gallery', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockResolvedValueOnce(mockImages);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('owner-image-grid')).toBeInTheDocument();
      });

      // Click delete on image 2
      const deleteBtn = screen.getByTestId('delete-image-img-2');
      await user.click(deleteBtn);

      // Confirmation dialog appears
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /delete photo\?/i })).toBeInTheDocument();

      // Confirm deletion
      businessService.deleteBusinessImage.mockResolvedValueOnce(null);
      businessService.getBusinessImages.mockResolvedValueOnce([mockImages[0]]);

      const confirmBtn = screen.getByTestId('confirm-delete-btn');
      await user.click(confirmBtn);

      expect(businessService.deleteBusinessImage).toHaveBeenCalledWith('biz-123', 'img-2');
      expect(await screen.findByText('Photo deleted successfully!')).toBeInTheDocument();
      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
      expect(businessService.getBusinessImages).toHaveBeenCalledTimes(2);
    });

    it('cancels deletion when user clicks cancel in the dialog', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockResolvedValueOnce(mockImages);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('owner-image-grid')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByTestId('delete-image-img-2');
      await user.click(deleteBtn);

      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();

      const cancelBtn = screen.getByTestId('cancel-delete-btn');
      await user.click(cancelBtn);

      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
      expect(businessService.deleteBusinessImage).not.toHaveBeenCalled();
    });

    it('handles image loading and failure states with retry option', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [mockExistingBusiness],
        totalElements: 1,
      });
      businessService.getBusinessImages.mockRejectedValueOnce(new Error('Network error loading photos'));

      renderComponent();

      expect(await screen.findByTestId('images-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load business photos')).toBeInTheDocument();
      expect(screen.getByText('Network error loading photos')).toBeInTheDocument();

      // Retry
      businessService.getBusinessImages.mockResolvedValueOnce(mockImages);
      const retryBtn = screen.getByTestId('retry-images-btn');
      await user.click(retryBtn);

      expect(await screen.findByTestId('owner-image-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('images-error')).not.toBeInTheDocument();
    });
  });

  describe('Business Owner Review Dashboard Integration', () => {
    it('displays review summary card with average rating and review count for rated business', async () => {
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [
          {
            ...mockExistingBusiness,
            averageRating: 4.8,
            reviewCount: 15,
          },
        ],
        totalElements: 1,
      });

      renderComponent();

      const summaryCard = await screen.findByTestId('business-reviews-summary-card');
      expect(summaryCard).toBeInTheDocument();

      // Check average rating
      const ratingEl = screen.getByTestId('business-profile-average-rating');
      expect(ratingEl).toHaveTextContent('4.8');

      // Check review count
      const countEl = screen.getByTestId('business-profile-review-count');
      expect(countEl).toHaveTextContent('Based on 15 customer reviews');

      // Check badge
      const badgeEl = screen.getByTestId('business-profile-review-count-badge');
      expect(badgeEl).toHaveTextContent('15 reviews');

      // Check button exists
      const dashboardBtn = screen.getByTestId('view-review-dashboard-btn');
      expect(dashboardBtn).toBeInTheDocument();
      expect(dashboardBtn).toHaveTextContent('View Review Dashboard');
    });

    it('displays singular "review" label when business has exactly 1 review', async () => {
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [
          {
            ...mockExistingBusiness,
            averageRating: 5.0,
            reviewCount: 1,
          },
        ],
        totalElements: 1,
      });

      renderComponent();

      await screen.findByTestId('business-reviews-summary-card');

      const countEl = screen.getByTestId('business-profile-review-count');
      expect(countEl).toHaveTextContent('Based on 1 customer review');

      const badgeEl = screen.getByTestId('business-profile-review-count-badge');
      expect(badgeEl).toHaveTextContent('1 review');
    });

    it('shows appropriate empty message for businesses with zero reviews', async () => {
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [
          {
            ...mockExistingBusiness,
            averageRating: 0.0,
            reviewCount: 0,
          },
        ],
        totalElements: 1,
      });

      renderComponent();

      await screen.findByTestId('business-reviews-summary-card');

      const noReviewsEl = screen.getByTestId('business-profile-no-reviews');
      expect(noReviewsEl).toBeInTheDocument();
      expect(noReviewsEl).toHaveTextContent('No customer reviews yet');
      expect(screen.queryByTestId('business-profile-average-rating')).not.toBeInTheDocument();

      // Dashboard button is still available
      const dashboardBtn = screen.getByTestId('view-review-dashboard-btn');
      expect(dashboardBtn).toBeInTheDocument();
    });

    it('navigates to /business-reviews when clicking View Review Dashboard', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [
          {
            ...mockExistingBusiness,
            averageRating: 4.5,
            reviewCount: 8,
          },
        ],
        totalElements: 1,
      });

      renderComponent();

      const dashboardBtn = await screen.findByTestId('view-review-dashboard-btn');
      await user.click(dashboardBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/business-reviews');
    });

    it('does not display review summary card to non-BUSINESS users', async () => {
      useAuth.mockReturnValue({
        user: residentUser,
        isLoading: false,
      });

      renderComponent();

      await screen.findByText('Business Account Required');
      expect(screen.queryByTestId('business-reviews-summary-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('view-review-dashboard-btn')).not.toBeInTheDocument();
    });

    it('does not display review summary card while editing business profile', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        user: businessUser,
        isLoading: false,
      });
      businessService.getMyBusinesses.mockResolvedValueOnce({
        content: [
          {
            ...mockExistingBusiness,
            averageRating: 4.8,
            reviewCount: 15,
          },
        ],
        totalElements: 1,
      });

      renderComponent();

      await screen.findByTestId('business-reviews-summary-card');

      // Click Edit Business Profile
      const editBtn = screen.getByRole('button', { name: 'Edit Business Profile' });
      await user.click(editBtn);

      expect(screen.getByTestId('business-edit-form')).toBeInTheDocument();
      expect(screen.queryByTestId('business-reviews-summary-card')).not.toBeInTheDocument();
    });
  });
});
