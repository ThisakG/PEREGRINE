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

// Render sits in front of this app as a single reverse-proxy hop, adding a
// real X-Forwarded-For header for every request. Trusting exactly "1" hop
// (not `true`, which would trust the header at any depth) tells Express
// exactly how many proxies are legitimately between the internet and this
// app, so express-rate-limit can correctly key its limits off the real
// visitor IP rather than Render's own internal IP - without this, every
// request would appear to come from the same address and share one global
// rate-limit bucket. `true` would be a security regression here: it would
// make Express trust ANY X-Forwarded-For value a client sends directly,
// letting someone bypass rate limiting by just faking that header.
app.set("trust proxy", 1);

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
