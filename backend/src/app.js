// =============================================================================
// app.js (integration layer)
// -----------------------------------------------------------------------------
// WHAT: Builds and configures the Express application: security headers,
//       CORS, rate limiting, JSON body parsing (with a size cap), routes,
//       and the centralized error handler - in that order, which matters:
//       security middleware must run before routes ever see a request, and
//       errorHandler must be registered LAST so it can catch errors from
//       everything above it.
// =============================================================================

import express from "express";
import { helmetMiddleware, corsMiddleware } from "./middleware/security.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { iocRouter } from "./routes/iocRoutes.js";
import { exportRouter } from "./routes/exportRoutes.js";

export const app = express();

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(generalLimiter);

// A small explicit body-size limit - an IoC lookup request body is a few
// dozen bytes at most, so capping it at 10kb blocks trivially-cheap
// request-body-flooding attempts without affecting any real usage.
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/ioc", iocRouter);
app.use("/api/export", exportRouter);

// Must be registered after all routes - see file header comment.
app.use(errorHandler);
