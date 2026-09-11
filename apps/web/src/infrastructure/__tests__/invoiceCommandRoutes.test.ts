import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn().mockReturnValue(null)
}));

vi.mock('@/lib/db', () => ({
  getDbSafe: vi.fn().mockReturnValue(null)
}));

describe('Invoice & Report Command Route Handlers', () => {
  it('POST /api/invoices/[id]/pay returns 503 when DB is not configured', async () => {
    const { POST: payPOST } = await import('../../../app/api/invoices/[id]/pay/route');
    const req = new NextRequest('http://localhost:3000/api/invoices/inv-1/pay', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'Tiền mặt', cashier: 'Thu ngân A' })
    });
    const params = Promise.resolve({ id: 'inv-1' });

    const res = await payPOST(req, { params });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe('DATABASE_URL is not configured');
  });

  it('POST /api/invoices/[id]/cancel returns 503 when DB is not configured', async () => {
    const { POST: cancelPOST } = await import('../../../app/api/invoices/[id]/cancel/route');
    const req = new NextRequest('http://localhost:3000/api/invoices/inv-1/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Nhập sai', cancelledBy: 'Thu ngân A' })
    });
    const params = Promise.resolve({ id: 'inv-1' });

    const res = await cancelPOST(req, { params });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe('DATABASE_URL is not configured');
  });

  it('POST /api/reports/[id]/export-pdf returns 503 when DB is not configured', async () => {
    const { POST: exportPdfPOST } = await import('../../../app/api/reports/[id]/export-pdf/route');
    const req = new NextRequest('http://localhost:3000/api/reports/rep-1/export-pdf', {
      method: 'POST',
      body: JSON.stringify({ cloudPdfUrl: 'https://cdn.example.com/rep-1.pdf' })
    });
    const params = Promise.resolve({ id: 'rep-1' });

    const res = await exportPdfPOST(req, { params });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe('DATABASE_URL is not configured');
  });

  it('POST /api/invoices/[id]/pay returns 400 when id is empty', async () => {
    const { POST: payPOST } = await import('../../../app/api/invoices/[id]/pay/route');
    const req = new NextRequest('http://localhost:3000/api/invoices//pay', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const params = Promise.resolve({ id: '' });

    const res = await payPOST(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing invoice id');
  });

  it('POST /api/reports/[id]/export-pdf returns 400 when id is empty', async () => {
    const { POST: exportPdfPOST } = await import('../../../app/api/reports/[id]/export-pdf/route');
    const req = new NextRequest('http://localhost:3000/api/reports//export-pdf', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const params = Promise.resolve({ id: '' });

    const res = await exportPdfPOST(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing report id');
  });
});
