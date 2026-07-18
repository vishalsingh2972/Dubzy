import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { dubbingJobs, sourceVideos } from "../../db/schema.js";

export const getDubbingJobById = async (jobId: string) => {
  const [job] = await db
    .select({
      id: dubbingJobs.id,
      videoKey: sql<string | null>`coalesce(${sourceVideos.videoKey}, ${dubbingJobs.videoKey})`,
      sourceLanguage: sql<string>`coalesce(${sourceVideos.sourceLanguage}, ${dubbingJobs.sourceLanguage})`,
      targetLanguage: dubbingJobs.targetLanguage,
      status: dubbingJobs.status,
      errorMessage: dubbingJobs.errorMessage,
      audioKey: dubbingJobs.audioKey,
      dubbedAudioKey: dubbingJobs.dubbedAudioKey,
      dubbedVideoKey: dubbingJobs.dubbedVideoKey,
    })
    .from(dubbingJobs)
    .leftJoin(sourceVideos, eq(dubbingJobs.sourceId, sourceVideos.id))
    .where(eq(dubbingJobs.id, jobId));

  return job;
};

export const updateDubbingJob = async (
  jobId: string,
  values: Partial<typeof dubbingJobs.$inferInsert>,
) => {
  await db
    .update(dubbingJobs)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(dubbingJobs.id, jobId));
};

export const updateDubbingJobIfStatus = async (
  jobId: string,
  expectedStatus: typeof dubbingJobs.$inferSelect.status,
  values: Partial<typeof dubbingJobs.$inferInsert>,
) => {
  const updatedRows = await db
    .update(dubbingJobs)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(dubbingJobs.id, jobId),
        eq(dubbingJobs.status, expectedStatus),
      ),
    )
    .returning({ id: dubbingJobs.id });

  return updatedRows.length > 0;
};
