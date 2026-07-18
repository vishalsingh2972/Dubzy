import type PgBoss from "pg-boss";
import { logger } from "../../lib/logger.js";
import { processDubbingJob } from "./process.js";
import { DUBBING_JOB_QUEUE, type DubbingJobMessage } from "./types.js";

export const registerDubbingJobWorker = async (boss: PgBoss) => {
  await boss.createQueue(DUBBING_JOB_QUEUE, {
    name: DUBBING_JOB_QUEUE,
    retryLimit: 0,
  });

  await boss.work<DubbingJobMessage>(DUBBING_JOB_QUEUE, async (jobs) => {
    const [job] = jobs;

    if (!job) {
      logger.warn("dubbing_job.queue.empty_batch");
      return;
    }

    await processDubbingJob(job.data);
  });
};
