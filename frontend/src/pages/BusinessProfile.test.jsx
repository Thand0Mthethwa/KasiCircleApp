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

  beforeEach(() => {
    vi.clearAllMocks();
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
});
