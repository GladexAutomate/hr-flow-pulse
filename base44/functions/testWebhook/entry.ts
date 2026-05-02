import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, key } = await req.json();
  if (!url) return Response.json({ error: 'No URL provided' }, { status: 400 });

  const response = await fetch(url, {
    method: 'GET',
  });

  return Response.json({ status: response.status, ok: response.ok });
});