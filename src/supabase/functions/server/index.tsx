import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", cors());
app.use("*", logger(console.log));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BUCKET_NAME = "make-0c6958dd-files";

// Track initialization status
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Initialize storage bucket and config
async function initialize() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Initialize bucket
      const { data: buckets, error: listError } =
        await supabase.storage.listBuckets();

      if (listError) {
        console.error("Error listing buckets:", listError);
        throw listError;
      }

      const bucketExists = buckets?.some(
        (bucket) => bucket.name === BUCKET_NAME
      );

      if (!bucketExists) {
        console.log("Creating storage bucket...");
        const { data, error } = await supabase.storage.createBucket(
          BUCKET_NAME,
          {
            public: false,
          }
        );
        if (error) {
          console.error("Error creating bucket:", error);
          throw error;
        } else {
          console.log("Storage bucket created successfully:", data);
        }
      } else {
        console.log("Storage bucket already exists");
      }

      // Initialize config
      const downloadPwd = await kv.get("config:download-password");
      if (!downloadPwd) {
        await kv.set("config:download-password", "download123");
      }

      const adminPwd = await kv.get("config:admin-password");
      if (!adminPwd) {
        await kv.set("config:admin-password", "admin123");
      }

      const categories = await kv.get("categories");
      if (!categories) {
        await kv.set(
          "categories",
          JSON.stringify(["College", "School", "University", "Other"])
        );
      }

      isInitialized = true;
      console.log("Server initialization complete");
    } catch (error) {
      console.error("Error during initialization:", error);
      initPromise = null; // Allow retry on next request
    }
  })();

  return initPromise;
}

// Start initialization
initialize();

// Middleware to ensure initialization is complete
app.use("/make-server-0c6958dd/*", async (c, next) => {
  await initialize();
  return next();
});

// Verify password middleware
async function verifyPassword(
  password: string,
  type: "download" | "admin"
): Promise<boolean> {
  const storedPassword = await kv.get(`config:${type}-password`);
  return password === storedPassword;
}

// Upload file endpoint
app.post("/make-server-0c6958dd/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = (formData.get("description") as string) || "";

    if (!file || !title || !category) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Ensure bucket exists
    if (!isInitialized) {
      console.log("Waiting for initialization...");
      await initialize();
    }

    // Verify bucket exists before upload
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.error("Bucket does not exist, attempting to create...");
      const { error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        {
          public: false,
        }
      );
      if (createError) {
        console.error("Failed to create bucket:", createError);
        return c.json(
          { error: "Storage not available. Please try again." },
          500
        );
      }
    }

    // Upload to storage
    const timestamp = Date.now();
    const fileName = `${category}/${timestamp}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    console.log(`Uploading file: ${fileName} (${file.size} bytes)`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return c.json(
        { error: `File upload failed: ${uploadError.message}` },
        500
      );
    }

    console.log("File uploaded successfully:", uploadData);

    // Save metadata to KV store
    const fileId = `file:${timestamp}`;
    const fileMetadata = {
      id: fileId,
      title,
      category,
      description,
      status: "pending",
      fileUrl: fileName,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    };

    await kv.set(fileId, JSON.stringify(fileMetadata));

    return c.json({
      success: true,
      message: "File uploaded successfully and pending approval",
      fileId,
    });
  } catch (error) {
    console.error("Error in upload endpoint:", error);
    return c.json({ error: `Upload failed: ${error.message}` }, 500);
  }
});

// Get categories
app.get("/make-server-0c6958dd/categories", async (c) => {
  try {
    const categoriesData = await kv.get("categories");
    const categories = categoriesData ? JSON.parse(categoriesData) : [];
    return c.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json(
      { error: `Failed to fetch categories: ${error.message}` },
      500
    );
  }
});

// Get approved files (with password)
app.post("/make-server-0c6958dd/files/approved", async (c) => {
  try {
    const { password, category } = await c.req.json();

    const isValid = await verifyPassword(password, "download");
    if (!isValid) {
      return c.json({ error: "Invalid password" }, 401);
    }

    // Get all files with 'file:' prefix
    const allFiles = await kv.getByPrefix("file:");

    // Filter approved files
    let approvedFiles = allFiles
      .map((item) => JSON.parse(item))
      .filter((file) => file.status === "approved");

    // Filter by category if provided
    if (category) {
      approvedFiles = approvedFiles.filter(
        (file) => file.category === category
      );
    }

    // Get signed URLs for files
    const filesWithUrls = await Promise.all(
      approvedFiles.map(async (file) => {
        const { data: signedUrlData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(file.fileUrl, 3600); // 1 hour expiry

        return {
          ...file,
          downloadUrl: signedUrlData?.signedUrl || null,
        };
      })
    );

    return c.json({ files: filesWithUrls });
  } catch (error) {
    console.error("Error fetching approved files:", error);
    return c.json({ error: `Failed to fetch files: ${error.message}` }, 500);
  }
});

// Verify admin password
app.post("/make-server-0c6958dd/admin/verify", async (c) => {
  try {
    const { password } = await c.req.json();
    const isValid = await verifyPassword(password, "admin");
    return c.json({ valid: isValid });
  } catch (error) {
    console.error("Error verifying admin password:", error);
    return c.json({ error: `Verification failed: ${error.message}` }, 500);
  }
});

// Get all files for admin
app.get("/make-server-0c6958dd/admin/files", async (c) => {
  try {
    const allFiles = await kv.getByPrefix("file:");
    const files = allFiles.map((item) => JSON.parse(item));

    // Sort by uploadedAt descending
    files.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return c.json({ files });
  } catch (error) {
    console.error("Error fetching all files:", error);
    return c.json({ error: `Failed to fetch files: ${error.message}` }, 500);
  }
});

// Approve file
app.post("/make-server-0c6958dd/admin/approve/:fileId", async (c) => {
  try {
    const fileId = c.req.param("fileId");
    const fileData = await kv.get(fileId);

    if (!fileData) {
      return c.json({ error: "File not found" }, 404);
    }

    const file = JSON.parse(fileData);
    file.status = "approved";

    await kv.set(fileId, JSON.stringify(file));

    return c.json({ success: true, message: "File approved successfully" });
  } catch (error) {
    console.error("Error approving file:", error);
    return c.json({ error: `Approval failed: ${error.message}` }, 500);
  }
});

// Reject file
app.post("/make-server-0c6958dd/admin/reject/:fileId", async (c) => {
  try {
    const fileId = c.req.param("fileId");
    const fileData = await kv.get(fileId);

    if (!fileData) {
      return c.json({ error: "File not found" }, 404);
    }

    const file = JSON.parse(fileData);
    file.status = "rejected";

    await kv.set(fileId, JSON.stringify(file));

    return c.json({ success: true, message: "File rejected successfully" });
  } catch (error) {
    console.error("Error rejecting file:", error);
    return c.json({ error: `Rejection failed: ${error.message}` }, 500);
  }
});

// Delete file
app.delete("/make-server-0c6958dd/admin/file/:fileId", async (c) => {
  try {
    const fileId = c.req.param("fileId");
    const fileData = await kv.get(fileId);

    if (!fileData) {
      return c.json({ error: "File not found" }, 404);
    }

    const file = JSON.parse(fileData);

    // Delete from storage
    await supabase.storage.from(BUCKET_NAME).remove([file.fileUrl]);

    // Delete from KV store
    await kv.del(fileId);

    return c.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return c.json({ error: `Deletion failed: ${error.message}` }, 500);
  }
});

// Update file metadata
app.put("/make-server-0c6958dd/admin/file/:fileId", async (c) => {
  try {
    const fileId = c.req.param("fileId");
    const { title, category, description } = await c.req.json();

    const fileData = await kv.get(fileId);
    if (!fileData) {
      return c.json({ error: "File not found" }, 404);
    }

    const file = JSON.parse(fileData);
    file.title = title || file.title;
    file.category = category || file.category;
    file.description =
      description !== undefined ? description : file.description;

    await kv.set(fileId, JSON.stringify(file));

    return c.json({ success: true, message: "File updated successfully" });
  } catch (error) {
    console.error("Error updating file:", error);
    return c.json({ error: `Update failed: ${error.message}` }, 500);
  }
});

// Add or reorder categories
app.post("/make-server-0c6958dd/admin/categories", async (c) => {
  try {
    const body = await c.req.json();

    // Handle reordering categories
    if (body.categories && Array.isArray(body.categories)) {
      await kv.set("categories", JSON.stringify(body.categories));
      return c.json({ success: true, message: "Categories order updated" });
    }

    // Handle adding a new category
    if (body.name) {
      if (!body.name.trim()) {
        return c.json({ error: "Category name is required" }, 400);
      }
      const categoriesData = await kv.get("categories");
      const categories = categoriesData ? JSON.parse(categoriesData) : [];
      if (categories.includes(body.name)) {
        return c.json({ error: "Category already exists" }, 400);
      }
      categories.push(body.name);
      await kv.set("categories", JSON.stringify(categories));
      return c.json({ success: true, message: "Category added successfully" });
    }

    return c.json({ error: "Invalid request body" }, 400);
  } catch (error) {
    console.error("Error in categories POST endpoint:", error);
    return c.json({ error: `Failed to update categories: ${error.message}` }, 500);
  }
});

// Update categories order
// Delete category
app.delete("/make-server-0c6958dd/admin/categories/:name", async (c) => {
  try {
    const name = c.req.param("name");

    const categoriesData = await kv.get("categories");
    const categories = categoriesData ? JSON.parse(categoriesData) : [];

    const filteredCategories = categories.filter((cat: string) => cat !== name);
    await kv.set("categories", JSON.stringify(filteredCategories));

    return c.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return c.json(
      { error: `Failed to delete category: ${error.message}` },
      500
    );
  }
});

// Update passwords
app.put("/make-server-0c6958dd/admin/passwords", async (c) => {
  try {
    const { downloadPassword, adminPassword } = await c.req.json();

    if (downloadPassword) {
      await kv.set("config:download-password", downloadPassword);
    }

    if (adminPassword) {
      await kv.set("config:admin-password", adminPassword);
    }

    return c.json({ success: true, message: "Passwords updated successfully" });
  } catch (error) {
    console.error("Error updating passwords:", error);
    return c.json(
      { error: `Failed to update passwords: ${error.message}` },
      500
    );
  }
});

// Health check endpoint
app.get("/make-server-0c6958dd/health", async (c) => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

    return c.json({
      status: "ok",
      initialized: isInitialized,
      bucketExists,
      bucketName: BUCKET_NAME,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: error.message,
        initialized: isInitialized,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

Deno.serve(app.fetch);
