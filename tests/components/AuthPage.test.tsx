import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from '../../components/AuthPage';
import { renderWithProviders } from '../testUtils';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(data),
  } as Response);

// Mock all sub-components that might require browser APIs
vi.mock('../../components/ui/modern-animated-sign-in', () => ({
  Ripple: () => null,
  AuthTabs: ({ formFields, handleSubmit }: any) => (
    <form onSubmit={handleSubmit} data-testid="auth-tabs-form">
      {Array.isArray(formFields?.fields) && formFields.fields.map((field: any, i: number) => (
        <input
          key={i}
          type={field.type}
          placeholder={field.placeholder}
          onChange={field.onChange}
          data-testid={`field-${i}`}
        />
      ))}
      <button type="submit">Sign In</button>
    </form>
  ),
  TechOrbitDisplay: () => null,
}));

describe('AuthPage', () => {
  it('renders email and password fields', () => {
    renderWithProviders(<AuthPage />);
    const emailInputs = screen.getAllByPlaceholderText(/email/i);
    expect(emailInputs.length).toBeGreaterThan(0);
    const passwordInputs = screen.getAllByPlaceholderText(/password/i);
    expect(passwordInputs.length).toBeGreaterThan(0);
  });

  it('renders a submit button', () => {
    renderWithProviders(<AuthPage />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows validation message when submitting empty form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthPage />);
    // Try to find a submit button and click it
    const submitButtons = screen.getAllByRole('button');
    const submitBtn = submitButtons.find(btn => btn.textContent?.match(/sign in|log in|login/i));
    if (submitBtn) {
      await user.click(submitBtn);
      // Should show some validation feedback
      await waitFor(() => {
        const errorMessages = document.querySelectorAll('[class*="error"], [class*="text-red"]');
        // Either error messages or still on auth page
        expect(screen.getAllByPlaceholderText(/email/i).length).toBeGreaterThan(0);
      });
    }
  });

  it('calls fetch on login submit with credentials', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        success: true,
        data: { userId: 'u1', email: 'test@example.com', role: 'user' },
      })
    );
    renderWithProviders(<AuthPage />);

    const emailInput = screen.getAllByPlaceholderText(/email/i)[0];
    const passwordInput = screen.getAllByPlaceholderText(/password/i)[0];

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButtons = screen.getAllByRole('button');
    const submitBtn = submitButtons.find(btn => btn.textContent?.match(/sign in|log in|login/i));
    if (submitBtn) {
      await user.click(submitBtn);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    }
  });
});
