// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import PasswordGateModal, { openPasswordGate, closePasswordGate } from '@components/PasswordGateModal';
import { setPassword, getPassword } from '@infra/apiClient';
import * as cloudDb from '@infra/cloudDbService';

describe('PasswordGateModal', () => {
  beforeEach(() => {
    setPassword('');
    openPasswordGate();
    vi.spyOn(cloudDb, 'testSupabaseConnection').mockResolvedValue({ success: true, message: 'Kết nối thành công!' });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    setPassword('');
    closePasswordGate();
  });

  it('shows the password input when no password is set', () => {
    render(<PasswordGateModal />);
    expect(screen.getByPlaceholderText(/nhập passkey/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /xác nhận/i })).toBeTruthy();
  });

  it('calls setPassword and hides the modal on a successful save', async () => {
    render(<PasswordGateModal />);

    const input = screen.getByPlaceholderText(/nhập passkey/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'my-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận/i }));

    await waitFor(() => expect(getPassword()).toBe('my-secret'));
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/nhập passkey/i)).toBeNull()
    );
    expect(cloudDb.testSupabaseConnection).toHaveBeenCalledTimes(1);
  });

  it('shows an error and keeps the modal open when the password is wrong', async () => {
    vi.spyOn(cloudDb, 'testSupabaseConnection').mockResolvedValue({
      success: false,
      message: 'Passkey không đúng!'
    });

    render(<PasswordGateModal />);

    const input = screen.getByPlaceholderText(/nhập passkey/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận/i }));

    await waitFor(() => expect(screen.getByText(/passkey không đúng/i)).toBeTruthy());
    expect(screen.queryByPlaceholderText(/nhập passkey/i)).toBeTruthy();
    expect(getPassword()).toBe('wrong');
  });

  it('allows continuing in local offline mode', async () => {
    render(<PasswordGateModal />);

    const offlineBtn = screen.getByRole('button', { name: /tiếp tục chế độ local/i });
    fireEvent.click(offlineBtn);

    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/nhập passkey/i)).toBeNull()
    );
  });
});

