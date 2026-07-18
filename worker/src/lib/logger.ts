type LogContext = Record<string, unknown>;

type NormalizedError = {
  message: string;
  stack?: string;
  name?: string;
};

const serializeContext = (context?: LogContext) => {
  if (!context || Object.keys(context).length === 0) {
    return "";
  }

  return ` ${JSON.stringify(context)}`;
};

const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return { message: "Unknown error", stack: JSON.stringify(error) };
};

const writeLog = (
  level: "INFO" | "WARN" | "ERROR",
  event: string,
  context?: LogContext,
) => {
  const line = `[${new Date().toISOString()}] ${level} ${event}${serializeContext(
    context,
  )}`;

  if (level === "ERROR") {
    console.error(line);
    return;
  }

  if (level === "WARN") {
    console.warn(line);
    return;
  }

  console.info(line);
};

export const logger = {
  info: (event: string, context?: LogContext) => {
    writeLog("INFO", event, context);
  },
  warn: (event: string, context?: LogContext) => {
    writeLog("WARN", event, context);
  },
  error: (event: string, error: unknown, context?: LogContext) => {
    writeLog("ERROR", event, {
      ...context,
      error: normalizeError(error),
    });
  },
};
