import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// How to use:
// - Use createLogger('context-name') inside modules/services so every log line carries a stable context.
// - Use the root logger directly only for bootstrapping code or truly global concerns.
// When to use:
// - Log lifecycle milestones, external integration failures, queue processing, and unexpected branches.
// - Avoid logging secrets, tokens, passwords, or entire request bodies.

export const logger = pino({
  level: isProduction ? "info" : "debug",
  ...(!isProduction ? { transport: { target: "pino/file", options: { destination: 1 } } } : {}),
});

export function createLogger(context: string) {
  return logger.child({ context });
}
