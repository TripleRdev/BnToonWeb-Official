const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify admin token
    const authHeader = req.headers.get("Authorization");
    const isAdmin = await verifyAdminToken(authHeader);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storageZone = Deno.env.get("BUNNY_STORAGE_ZONE");
    const apiKey = Deno.env.get("BUNNY_STORAGE_API_KEY");
    const cdnHostname = Deno.env.get("BUNNY_CDN_HOSTNAME");
    // Optional: specify region (ny, la, sg, de, uk, syd, br) or leave empty for default
    const storageRegion = Deno.env.get("BUNNY_STORAGE_REGION") || "";

    if (!storageZone || !apiKey || !cdnHostname) {
      console.error("Missing Bunny.net configuration:", {
        hasStorageZone: !!storageZone,
        hasApiKey: !!apiKey,
        hasCdnHostname: !!cdnHostname,
      });
      return new Response(
        JSON.stringify({ error: "Storage not configured properly" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;
    const action = (formData.get("action") as string) || "upload";

    // Build storage URL with optional region
    const storageHost = storageRegion
      ? `${storageRegion}.storage.bunnycdn.com`
      : "storage.bunnycdn.com";

    if (action === "delete") {
      // Delete file from Bunny.net
      const deleteUrl = `https://${storageHost}/${storageZone}/${path}`;
      console.log("Deleting from:", deleteUrl);

      const deleteResponse = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          AccessKey: apiKey,
        },
      });

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        console.error("Bunny delete error:", errorText);
        throw new Error("Failed to delete file");
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload file
    if (!file || !path) {
      return new Response(
        JSON.stringify({ error: "File and path are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const uploadUrl = `https://${storageHost}/${storageZone}/${path}`;
    console.log("Uploading to:", uploadUrl);
    console.log("File size:", uint8Array.length, "bytes");
    console.log("Content-Type:", file.type);

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: uint8Array,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Bunny upload error:", errorText);
      console.error("Status:", uploadResponse.status);
      
      if (uploadResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: "Storage authentication failed. Please verify BUNNY_STORAGE_API_KEY is the Storage Zone Password (not Account API Key)." 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`Failed to upload file: ${errorText}`);
    }

    const publicUrl = `https://${cdnHostname}/${path}`;
    console.log("Upload successful, public URL:", publicUrl);

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyAdminToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  
  const token = authHeader.replace("Bearer ", "");
  const secret = Deno.env.get("ADMIN_JWT_SECRET");
  if (!secret) return false;

  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureInput = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);
    const signatureArrayBuffer = new ArrayBuffer(signature.length);
    new Uint8Array(signatureArrayBuffer).set(signature);
    
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureArrayBuffer,
      encoder.encode(signatureInput)
    );

    if (!valid) return false;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return payload.role === "admin";
  } catch {
    return false;
  }
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
