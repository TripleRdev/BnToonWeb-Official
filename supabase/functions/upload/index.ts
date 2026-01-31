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

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

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

    const publicUrl = `https://${cdnHostname}/${path}`;
    console.log("Upload successful, public URL:", publicUrl);

    return new Response(
      JSON.stringify({
        url: publicUrl,
        storage_host_used: putResult.publicStorageHost,
        detected_region: putResult.detectedRegion,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
