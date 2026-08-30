import app from '@api';

export const dynamic = 'force-dynamic';

const handler = async (req: Request): Promise<Response> => {
  return app.fetch(req);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
export const HEAD = handler;
