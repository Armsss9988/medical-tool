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
    expect(screen.getByPlaceholderText(/nhập mật khẩu api/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /lưu mật khẩu/i })).toBeTruthy();
  });

  it('calls setPassword and hides the modal on a successful save', async () => {
    render(<PasswordGateModal />);

    const input = screen.getByPlaceholderText(/nhập mật khẩu api/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'my-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /lưu mật khẩu/i }));

    await waitFor(() => expect(getPassword()).toBe('my-secret'));
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/nhập mật khẩu api/i)).toBeNull()
    );
    expect(cloudDb.testSupabaseConnection).toHaveBeenCalledTimes(1);
  });

  it('shows an error and keeps the modal open when the password is wrong', async () => {
    vi.spyOn(cloudDb, 'testSupabaseConnection').mockResolvedValue({
      success: false,
      message: 'Sai mật khẩu API!'
    });

    render(<PasswordGateModal />);

    const input = screen.getByPlaceholderText(/nhập mật khẩu api/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /lưu mật khẩu/i }));

    await waitFor(() => expect(screen.getByText(/sai mật khẩu/i)).toBeTruthy());
    expect(screen.queryByPlaceholderText(/nhập mật khẩu api/i)).toBeTruthy();
    expect(getPassword()).toBe('wrong');
  });

  it('persists the API base URL override on save', async () => {
    render(<PasswordGateModal />);

    const baseInput = screen.getByPlaceholderText(/api base url/i) as HTMLInputElement;
    fireEvent.change(baseInput, { target: { value: 'https://example.com/api' } });
    fireEvent.change(screen.getByPlaceholderText(/nhập mật khẩu api/i), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /lưu mật khẩu/i }));

    await waitFor(() =>
      expect(localStorage.getItem('golab_api_base')).toBe('https://example.com/api')
    );
  });
});
