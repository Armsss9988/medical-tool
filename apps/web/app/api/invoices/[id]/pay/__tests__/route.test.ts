import { describe, it, expect, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn().mockReturnValue(null)
}));

vi.mock('@/lib/db', () => ({
  getDbSafe: vi.fn().mockReturnValue(null)
}));

describe('POST /api/invoices/[id]/pay', () => {
  it('returns 503 when DB is not configured', async () => {
    const req = new NextRequest('http://localhost:3000/api/invoices/inv-1/pay', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'Tiền mặt', cashier: 'Thu ngân A' })
    });
    const params = Promise.resolve({ id: 'inv-1' });

    const res = await POST(req, { params });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe('DATABASE_URL is not configured');
  });
});
