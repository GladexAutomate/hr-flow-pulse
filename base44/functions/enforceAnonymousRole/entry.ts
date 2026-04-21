import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called on first login to ensure new users always start as anonymous.
// Accepts { user_id } in the request body.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id } = await req.json();

    if (!user_id) {
      return Response.json({ error: 'user_id required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(user_id, { role: 'anonymous' });
    console.log(`Enforced anonymous role for user ${user_id}`);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});