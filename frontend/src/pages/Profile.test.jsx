import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Profile from './Profile';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock userService
vi.mock('../services/api', () => ({
  userService: {
    updateProfile: vi.fn(),
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

describe('Profile Page', () => {
  const mockLogout = vi.fn();
  let mockUpdateUser;

  const mockUser = {
    id: 'user-123',
    firstName: 'Thando',
    lastName: 'Mthethwa',
    email: 'thando@example.com',
    phoneNumber: '+27821234567',
    role: 'USER',
    accountType: 'RESIDENT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUser = vi.fn();

    useAuth.mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
      logout: mockLogout,
      isLoading: false,
    });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

  it('displays profile information correctly in view mode', () => {
    renderComponent();

    // User initials in avatar
    expect(screen.getByText('TM')).toBeInTheDocument();

    // Full name and email
    expect(screen.getByRole('heading', { name: 'Thando Mthethwa' })).toBeInTheDocument();
    expect(screen.getAllByText('thando@example.com').length).toBeGreaterThanOrEqual(1);

    // Detail items
    expect(screen.getByText('Thando')).toBeInTheDocument();
    expect(screen.getByText('Mthethwa')).toBeInTheDocument();
    expect(screen.getByText('+27821234567')).toBeInTheDocument();

    // Edit button and Sign Out button
    expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('displays account type correctly in user-friendly format for Resident', () => {
    renderComponent();
    expect(screen.getAllByText(/Resident/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Local community member/i)).toBeInTheDocument();
  });

  it('displays account type correctly in user-friendly format for Worker', () => {
    useAuth.mockReturnValue({
      user: { ...mockUser, accountType: 'WORKER' },
      updateUser: mockUpdateUser,
      logout: mockLogout,
      isLoading: false,
    });
    renderComponent();
    expect(screen.getAllByText(/Worker/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Providing skilled services/i)).toBeInTheDocument();
  });

  it('lets worker accounts open their worker profile manager', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: { ...mockUser, accountType: 'WORKER' },
      updateUser: mockUpdateUser,
      logout: mockLogout,
      isLoading: false,
    });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'Manage' }));

    expect(mockNavigate).toHaveBeenCalledWith('/worker-profile');
  });

  it('displays account type correctly in user-friendly format for Business', () => {
    useAuth.mockReturnValue({
      user: { ...mockUser, accountType: 'BUSINESS' },
      updateUser: mockUpdateUser,
      logout: mockLogout,
      isLoading: false,
    });
    renderComponent();
    expect(screen.getAllByText(/Business/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Local enterprise & service provider/i)).toBeInTheDocument();
  });

  it('opens edit mode when clicking Edit Profile button', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));

    expect(screen.getByRole('heading', { name: /edit personal information/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Thando');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Mthethwa');

    // Email and Account Type should be displayed as disabled/read-only
    const emailInput = screen.getByDisplayValue('thando@example.com');
    expect(emailInput).toBeDisabled();

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('restores original information when clicking Cancel in edit mode', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));

    // Modify fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'ChangedName');
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'ChangedSurname');

    expect(firstNameInput).toHaveValue('ChangedName');
    expect(lastNameInput).toHaveValue('ChangedSurname');

    // Click Cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Should return to view mode with original values
    expect(screen.queryByRole('heading', { name: /edit personal information/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thando Mthethwa' })).toBeInTheDocument();
    expect(screen.getByText('Thando')).toBeInTheDocument();
    expect(screen.getByText('Mthethwa')).toBeInTheDocument();
  });

  it('updates profile successfully and displays the updated information', async () => {
    const user = userEvent.setup();

    const updatedResponse = {
      ...mockUser,
      firstName: 'Sipho',
      lastName: 'Dlamini',
    };
    userService.updateProfile.mockResolvedValueOnce(updatedResponse);

    function DynamicProfileWrapper() {
      const [currentUser, setCurrentUser] = useState(mockUser);
      useAuth.mockReturnValue({
        user: currentUser,
        updateUser: (newUser) => {
          mockUpdateUser(newUser);
          setCurrentUser(newUser);
        },
        logout: mockLogout,
        isLoading: false,
      });

      return (
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );
    }

    render(<DynamicProfileWrapper />);

    // Open edit mode
    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Sipho');
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'Dlamini');

    // Click Save
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalledWith({
        firstName: 'Sipho',
        lastName: 'Dlamini',
        phoneNumber: '+27821234567',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedResponse);
    });

    // Success banner is displayed
    expect(await screen.findByText(/profile updated successfully!/i)).toBeInTheDocument();

    // View mode displays updated name
    expect(screen.getByRole('heading', { name: 'Sipho Dlamini' })).toBeInTheDocument();
  });

  it('displays an error message when the profile update fails', async () => {
    const user = userEvent.setup();

    userService.updateProfile.mockRejectedValueOnce({
      data: { message: 'Server failed to update profile' },
    });

    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'NewName');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalled();
    });

    // Error banner should appear
    expect(await screen.findByText(/server failed to update profile/i)).toBeInTheDocument();
    // Remains in edit mode
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions while a request is processing', async () => {
    const user = userEvent.setup();

    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    userService.updateProfile.mockReturnValueOnce(pendingPromise);

    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Save button should now be disabled and show loading state
    expect(screen.getByRole('button', { name: /saving changes/i })).toBeDisabled();

    // Attempting another click while disabled
    await user.click(screen.getByRole('button', { name: /saving changes/i }));

    // updateProfile should have been called only once
    expect(userService.updateProfile).toHaveBeenCalledTimes(1);

    // Resolve the promise to clean up
    resolvePromise({ ...mockUser, firstName: 'Updated' });
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
    });
  });
});
