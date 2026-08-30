// Import from pre-bundled output (built by `npm run build:api` before Vercel deploys)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – dist/api/index.js is generated at build time, no .d.ts available
import appModule from '../dist/api/index.js';
const app = appModule as { fetch: (req: Request) => Promise<Response> };

function isWebRequest(value: unknown): value is Request {
  return typeof Request !== 'undefined' && value instanceof Request;
}

async function incomingToWebRequest(incoming: any): Promise<Request> {
  const host = incoming?.headers?.host ?? process.env.VERCEL_URL ?? 'localhost';
  const url = `https://${host}${incoming?.url ?? '/'}`;
  const headers = new Headers();
  const rawHeaders = incoming?.headers ?? {};
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (Array.isArray(value)) headers.set(key, value.join(', '));
    else if (value != null) headers.set(key, String(value));
  }
  const method = (incoming?.method ?? 'GET') as string;
  const hasBody = method !== 'GET' && method !== 'HEAD';
  let body: BodyInit | undefined;
  if (hasBody) {
    body = incoming?.rawBody ??
      (incoming?.on
        ? await new Promise<string>((resolve, reject) => {
            let data = '';
            incoming.on('data', (chunk: Buffer) => (data += chunk));
            incoming.on('end', () => resolve(data));
            incoming.on('error', reject);
          })
        : undefined);
  }
  return new Request(url, { method, headers, body });
}

export default async function handler(reqOrRequest: any, _maybeRes?: any): Promise<Response> {
  try {
    const request = isWebRequest(reqOrRequest)
      ? reqOrRequest
      : await incomingToWebRequest(reqOrRequest);
    return await app.fetch(request);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'internal_error', detail: String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
