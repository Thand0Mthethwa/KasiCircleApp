import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomNavigation, Header, Input, SearchBar, WorkerCard } from './index';

describe('shared accessible components', () => {
  it('submits the search query by keyboard or button instead of navigating on each keystroke', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar placeholder="Search workers" onSearch={onSearch} />);

    const input = screen.getByRole('searchbox', { name: 'Search workers' });
    await user.type(input, ' electrician ');
    expect(onSearch).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledWith('electrician');
  });

  it('renders worker cards as keyboard-operable buttons', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<WorkerCard name="Amahle" profession="Electrician" onClick={onClick} />);

    const workerButton = screen.getByRole('button', { name: 'View Amahle, Electrician' });
    workerButton.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('announces primary navigation and the current page', () => {
    render(<BottomNavigation active="jobs" onNavigate={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jobs' })).toHaveAttribute('aria-current', 'page');
  });

  it('does not render a back control without an action', () => {
    render(<Header title="Jobs" />);

    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
  });

  it('associates input validation errors with the invalid control', () => {
    render(<Input name="email" label="Email" error="Enter a valid email address." />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-describedby', 'email-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
  });
});
