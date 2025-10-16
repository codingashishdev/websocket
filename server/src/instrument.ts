import * as Sentry from "@sentry/node";
import dotenv from "dotenv"
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import logger from "./logger.js";

dotenv.config()

const dsn = process.env.SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        sendDefaultPii: true,
        integrations: [
            // Add our Profiling integration
            nodeProfilingIntegration(),
        ],
        tracesSampleRate: process.env.NODE_ENV == 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV == 'production' ? 0.1 : 1.0,
        enableLogs: true,
    });
}
else {
    logger.warn('SENTRY_DSN not configured. Sentry monitoring disabled.')
}