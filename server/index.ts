
import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Env } from "./types";

import { homeRoutes } from "./routes/home.routes";
import { memberRoutes } from "./routes/member.routes";
import { billRoutes } from "./routes/bill.routes";
import { paymentRoutes } from "./routes/payment.routes";
import authRoutes from "./routes/auth.routes";

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
    ],
  })
);

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "Bill Splitter API is running",
  });
});

app.route("/api/homes", homeRoutes);
app.route("/api/members", memberRoutes);
app.route("/api/bills", billRoutes);
app.route("/api", paymentRoutes);

app.route("/api/auth", authRoutes);

app.get("/api/test-members-route", (c) => {
  return c.json({
    success: true,
    message: "Member route test is working",
  });
});

// Handle unknown routes
app.notFound((c) => {
  return c.json(
    { error: "Route not found." },
    404,
  );
});

app.onError((error, c) => {
  console.error("Unhandled API error:", error);

  return c.json(
    { error: "Internal server error." },
    500,
  );
});

export default app;
