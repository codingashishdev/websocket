import * as Sentry from "@sentry/node";
import dotenv from "dotenv"
import { nodeProfilingIntegration } from "@sentry/profiling-node";

dotenv.config()

const dsn = process.env.SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        sendDefaultPii: true,

        integrations: [
            // Add our Profiling integration
            nodeProfilingIntegration(),
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        enableLogs: true,
    });
}