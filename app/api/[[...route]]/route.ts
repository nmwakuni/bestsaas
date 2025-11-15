import { Hono } from "hono";
import { handle } from "hono/vercel";
import { auth } from "@/lib/auth";

// Import route handlers
import studentsRouter from "./routes/students";
import feesRouter from "./routes/fees";
import paymentsRouter from "./routes/payments";
import mpesaRouter from "./routes/mpesa";
import messagesRouter from "./routes/messages";
import dashboardRouter from "./routes/dashboard";
import parentRouter from "./routes/parent";

export const runtime = "nodejs";

const app = new Hono().basePath("/api");

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Better Auth handler
app.on(["POST", "GET"], "/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// Mount routers
app.route("/students", studentsRouter);
app.route("/fees", feesRouter);
app.route("/payments", paymentsRouter);
app.route("/mpesa", mpesaRouter);
app.route("/messages", messagesRouter);
app.route("/dashboard", dashboardRouter);
app.route("/parent", parentRouter);

// Error handling
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    {
      error: err.message || "Internal server error",
    },
    500
  );
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
