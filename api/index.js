/**
 * Vercel Serverless Function entry point (pure JS).
 * Imports the prebuilt boot.js bundle.
 */
require("dotenv/config");

async function handler(req, res) {
  try {
    // Dynamic import for ESM compatibility
    const { default: app } = await import("../dist/boot.js");

    // Convert Node.js request to Web API Request
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;

    const method = req.method || "GET";
    let body;

    if (req.body && method !== "GET" && method !== "HEAD") {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && !Array.isArray(value)) {
        headers.set(key, value);
      } else if (Array.isArray(value) && value.length > 0) {
        headers.set(key, value[0]);
      }
    }

    const request = new Request(url, { method, headers, body });

    // Use Hono's fetch handler
    const response = await app.fetch(request);

    // Convert Web API Response to Node.js response
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (err) {
    console.error("[Vercel] Error:", err.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err.message || "Internal Server Error" }));
  }
}

module.exports = handler;
