import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { file_base64, file_name, ...data } = await req.json();

    // Upload file using service role if provided
    if (file_base64 && file_name) {
      const binaryStr = atob(file_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes]);
      const res = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob, filename: file_name });
      data.file_url = res.file_url;
    }

    const record = await base44.asServiceRole.entities.HRRequest.create(data);

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});