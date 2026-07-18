import PgBoss from "pg-boss";
import { env } from "./config/env.js";
import { pool } from "./db/client.js";
import { logger } from "./lib/logger.js";
import { registerDubbingJobWorker } from "./processes/dubbing-job/index.js";

const boss = new PgBoss({
  connectionString: env.DATABASE_URL,
  schema: env.PG_BOSS_SCHEMA,
});

const startWorker = async () => {
  await boss.start();
  await registerDubbingJobWorker(boss);

  logger.info("worker.ready");
};

const shutdown = async (signal: string) => {
  logger.info("worker.shutdown.started", { signal });

  try {
    await boss.stop();
    await pool.end();
    logger.info("worker.shutdown.completed", { signal });
    process.exit(0);
  } catch (error) {
    logger.error("worker.shutdown.failed", error, { signal });
    process.exit(1);
  }
};

void startWorker().catch(async (error) => {
  logger.error("worker.start.failed", error);
  await pool.end();
  process.exit(1);
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  logger.error("worker.unhandled_rejection", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("worker.uncaught_exception", error);
  void pool.end().finally(() => {
    process.exit(1);
  });
});
