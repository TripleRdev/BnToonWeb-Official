import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Admin email allowlist - must match frontend list
const ADMIN_EMAILS = [
  "admin@bntoon.com",
  "bntoonweb@gmail.com",
];

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

const REGION_CANDIDATES = ["", "ny", "la", "sg", "de", "uk", "syd", "br"] as const;

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const v = item.trim();
    if (!v) continue;
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function regionToHost(region: string): string {
  return region ? `${region}.storage.bunnycdn.com` : "storage.bunnycdn.com";
}

function buildHostCandidates(configuredRegion: string): string[] {
  return uniqueStrings([
    regionToHost(configuredRegion || ""),
    ...REGION_CANDIDATES.map((r) => regionToHost(r)),
  ]);
}

async function tryBunnyPut(params: {
  hosts: string[];
  storageZone: string;
  path: string;
  apiKey: string;
  contentType: string;
  body: ArrayBuffer;
}): Promise<{ publicStorageHost: string; detectedRegion?: string } | { error: string }> {
  let last401 = false;
  let lastError: { status: number; body: string; host: string } | null = null;

  for (const host of params.hosts) {
    const uploadUrl = `https://${host}/${params.storageZone}/${params.path}`;
    console.log("Uploading to:", uploadUrl);

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: params.apiKey,
        "Content-Type": params.contentType,
      },
      body: params.body,
    });

    if (res.ok) {
      const detectedRegion = host === "storage.bunnycdn.com" ? "" : host.split(".")[0];
      return {
        publicStorageHost: host,
        detectedRegion,
      };
    }

    const text = await res.text();
    console.error("Bunny upload error:", text);
    console.error("Status:", res.status);
    lastError = { status: res.status, body: text, host };

    if (res.status === 401) {
      last401 = true;
      continue;
    }

    return { error: `Bunny upload failed on ${host} [${res.status}]: ${text}` };
  }

  if (last401) {
    const attempted = params.hosts.join(", ");
    const hint =
      "Bunny responded 401 for all tested endpoints. This usually means either BUNNY_STORAGE_API_KEY is not the Storage Zone Password, or BUNNY_STORAGE_ZONE is not the exact storage zone name.";
    const last = lastError
      ? ` Last response on ${lastError.host}: ${lastError.body}`
      : "";
    return {
      error:
        `${hint} Attempted hosts: ${attempted}.` +
        ` If your storage zone is region-specific, set BUNNY_STORAGE_REGION to one of: ${REGION_CANDIDATES.filter(Boolean).join(", ")}.` +
        last,
    };
  }

  return { error: "Failed to upload file to storage" };
}

// Validate file magic bytes match claimed MIME type
function validateMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
           bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
  }
  
  // GIF: 47 49 46 38 (GIF8)
  if (mimeType === "image/gif") {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  }
  
  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (mimeType === "image/webp") {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  }
  
  // PDF: 25 50 44 46 (%PDF)
  if (mimeType === "application/pdf") {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }
  
  return false;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify Supabase JWT and check admin email
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("JWT verification failed:", claimsError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = claimsData.claims.email as string | undefined;
    
    // Check if user is an admin
    if (!isAdminEmail(userEmail)) {
      console.error("Access denied for email:", userEmail);
      return new Response(JSON.stringify({ error: "Access denied. Admin privileges required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin access granted for:", userEmail);

    const storageZone = Deno.env.get("BUNNY_STORAGE_ZONE");
    const apiKey = Deno.env.get("BUNNY_STORAGE_API_KEY");
    const cdnHostname = Deno.env.get("BUNNY_CDN_HOSTNAME");
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

    const hostCandidates = buildHostCandidates(storageRegion);

    if (action === "delete") {
      let deleted = false;
      let lastErr: { status: number; body: string; host: string } | null = null;

      for (const host of hostCandidates) {
        const deleteUrl = `https://${host}/${storageZone}/${path}`;
        console.log("Deleting from:", deleteUrl);

        const deleteResponse = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            AccessKey: apiKey,
          },
        });

        if (deleteResponse.ok || deleteResponse.status === 404) {
          deleted = true;
          break;
        }

        const errorText = await deleteResponse.text();
        console.error("Bunny delete error:", errorText);
        lastErr = { status: deleteResponse.status, body: errorText, host };

        if (deleteResponse.status === 401) {
          continue;
        }

        throw new Error(`Failed to delete file on ${host} [${deleteResponse.status}]: ${errorText}`);
      }

      if (!deleted) {
        throw new Error(
          `Failed to delete file from storage (auth failed). Last: ${lastErr?.host} [${lastErr?.status}] ${lastErr?.body}`
        );
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

    // ============ SERVER-SIDE VALIDATION ============
    
    // 1. File size validation (10MB for images, 50MB for PDFs)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
    const fileSize = file.size;
    
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
    
    if (fileSize > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${maxMB}MB` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Path validation - prevent directory traversal
    if (path.includes("..") || path.includes("//") || path.startsWith("/")) {
      return new Response(
        JSON.stringify({ error: "Invalid file path" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. File extension validation
    const dangerousExtensions = [".php", ".jsp", ".asp", ".aspx", ".exe", ".sh", ".bat", ".cmd", ".ps1", ".html", ".htm", ".js", ".svg"];
    const fileName = file.name.toLowerCase();
    
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      return new Response(
        JSON.stringify({ error: "File type not allowed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Allowed MIME types (server-side check)
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `File type '${file.type}' not allowed. Allowed: JPEG, PNG, GIF, WebP, PDF` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 5. Magic byte validation (verify actual file content matches claimed type)
    const magicBytes = uint8Array.slice(0, 8);
    const isValidMagic = validateMagicBytes(magicBytes, file.type);
    
    if (!isValidMagic) {
      return new Response(
        JSON.stringify({ error: "File content does not match declared type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("File size:", uint8Array.length, "bytes");
    console.log("Content-Type:", file.type);

    const putResult = await tryBunnyPut({
      hosts: hostCandidates,
      storageZone,
      path,
      apiKey,
      contentType: file.type || "application/octet-stream",
      body: arrayBuffer,
    });

    if ("error" in putResult) {
      return new Response(JSON.stringify({ error: putResult.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (putResult.detectedRegion && putResult.detectedRegion !== storageRegion) {
      console.log(
        `Detected Bunny storage region '${putResult.detectedRegion}'. Consider setting BUNNY_STORAGE_REGION to avoid retries.`
      );
    }

    // Add cache-busting timestamp to URL for immediate availability
    // But CDN will cache the file with long-lived headers
    const publicUrl = `https://${cdnHostname}/${path}`;
    console.log("Upload successful, public URL:", publicUrl);

    return new Response(
      JSON.stringify({
        url: publicUrl,
        storage_host_used: putResult.publicStorageHost,
        detected_region: putResult.detectedRegion,
        // Inform client that CDN caching is enabled
        cache_info: {
          immutable: true,
          max_age: 31536000, // 1 year in seconds
        },
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          // Suggest caching strategy to client
          "X-Cache-Strategy": "immutable",
        },
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
