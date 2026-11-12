import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Register from './Register';
import { useAuth } from '../contexts/AuthContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
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

describe('Register Page', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

  it('renders the registration form with all required inputs and elements', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/join kasicircle/i)).toBeInTheDocument();

    // Account type buttons
    expect(screen.getByRole('button', { name: /resident/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /worker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /business/i })).toBeInTheDocument();

    // Form inputs
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('allows Resident account type to be selected', async () => {
    const user = userEvent.setup();
    renderComponent();

    const residentBtn = screen.getByRole('button', { name: /resident/i });
    await user.click(residentBtn);

    expect(residentBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows Worker account type to be selected', async () => {
    const user = userEvent.setup();
    renderComponent();

    const workerBtn = screen.getByRole('button', { name: /worker/i });
    await user.click(workerBtn);

    expect(workerBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows Business account type to be selected', async () => {
    const user = userEvent.setup();
    renderComponent();

    const businessBtn = screen.getByRole('button', { name: /business/i });
    await user.click(businessBtn);

    expect(businessBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('includes the selected account type in the registration payload', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({ success: true });

    renderComponent();

    // Select 'Worker'
    await user.click(screen.getByRole('button', { name: /worker/i }));

    // Fill valid data
    await user.type(screen.getByLabelText(/full name/i), 'Sipho Dlamini');
    await user.type(screen.getByLabelText(/phone number/i), '+27781234567');
    await user.type(screen.getByLabelText(/email address/i), 'sipho@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
    await user.click(screen.getByRole('checkbox'));

    // Submit
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(1);
      expect(mockRegister).toHaveBeenCalledWith({
        fullName: 'Sipho Dlamini',
        phoneNumber: '+27781234567',
        email: 'sipho@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        accountType: 'Worker',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('validates required fields and shows validation errors without calling register', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Click submit immediately
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/you must agree to the terms of service/i)).toBeInTheDocument();
  });

  it('validates password mismatch and length constraints', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/phone number/i), '+27781234567');
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('checkbox'));

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('displays API errors appropriately when returned from auth context', () => {
    useAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'An account with this email already exists',
    });

    renderComponent();

    expect(
      screen.getByText(/an account with this email already exists/i)
    ).toBeInTheDocument();
  });
});

