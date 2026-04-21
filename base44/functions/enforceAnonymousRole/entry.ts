import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Scheduled function: runs every 5 minutes.
// Finds any user with role "user" (HR Staff) who joined in the last 10 minutes
// and resets them to "anonymous". This prevents self-registered users from
// bypassing the anonymous-by-default policy.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allUsers = await base44.asServiceRole.entities.User.list();

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const toReset = allUsers.filter(u => {
      if (u.role !== 'user') return false; // only target auto-assigned "user" role
      if (!u.created_date) return false;
      const joined = new Date(u.created_date);
      return joined >= tenMinutesAgo;
    });

    const results = [];
    for (const u of toReset) {
      await base44.asServiceRole.entities.User.update(u.id, { role: 'anonymous' });
      console.log(`Reset user ${u.email} from "user" to "anonymous"`);
      results.push(u.email);
    }

    return Response.json({ reset: results, count: results.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});