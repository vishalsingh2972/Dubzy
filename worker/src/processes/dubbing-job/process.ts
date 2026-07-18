import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getMediaDuration } from "../../lib/audio.js";
import { logger } from "../../lib/logger.js";
import { getUserSafeDubbingErrorMessage } from "./failures.js";
import {
  assertDifferentDubbingLanguages,
  resolveSourceLanguage,
} from "./languages.js";
import { cloneVoice } from "./tasks/clone-voice.js";
import { extractAudio } from "./tasks/extract-audio.js";
import { muxDubbedVideo } from "./tasks/mux-dubbed-video.js";
import { segmentTranscriptSentences } from "./tasks/segment-transcript-sentences.js";
import { synthesizeDubbedAudio } from "./tasks/synthesize-dubbed-audio.js";
import { transcribeAudio } from "./tasks/transcribe-audio.js";
import { translateTranscript } from "./tasks/translate-transcript.js";
import {
  getDubbingJobById,
  updateDubbingJob,
  updateDubbingJobIfStatus,
} from "./repository.js";
import type { DubbingJobMessage } from "./types.js";

export const processDubbingJob = async ({ jobId }: DubbingJobMessage) => {
  logger.info("dubbing_job.received", { jobId });

  const job = await getDubbingJobById(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (!job.videoKey) {
    throw new Error(`Job ${jobId} is missing a source video key`);
  }

  if (job.status === "completed") {
    logger.warn("dubbing_job.skipped_completed", { jobId });
    return;
  }

  if (job.status === "failed") {
    logger.warn("dubbing_job.skipped_failed", {
      jobId,
      errorMessage: job.errorMessage,
    });
    return;
  }

  if (job.status === "processing") {
    logger.warn("dubbing_job.skipped_processing", { jobId });
    return;
  }

  const markedProcessing = await updateDubbingJobIfStatus(jobId, "pending", {
    status: "processing",
    errorMessage: null,
  });

  if (!markedProcessing) {
    logger.warn("dubbing_job.skipped_status_transition", {
      jobId,
      expectedStatus: "pending",
    });
    return;
  }

  logger.info("dubbing_job.processing", { jobId });

  const tempDir = await mkdtemp(path.join(tmpdir(), "dubbing-worker-"));
  let currentStep = "mark_processing";

  try {
    currentStep = "extract_audio";
    logger.info("dubbing_job.step.started", { jobId, step: currentStep });
    const { audioKey, sourceAudioPath, sourceVideoPath } = await extractAudio({
      jobId,
      videoKey: job.videoKey,
      tempDir,
    });
    logger.info("dubbing_job.step.completed", { jobId, step: currentStep });

    await updateDubbingJob(jobId, {
      audioKey,
    });

    currentStep = "transcribe_audio";
    logger.info("dubbing_job.step.started", { jobId, step: currentStep });
    const transcription = await transcribeAudio({
      sourceAudioPath,
    });
    logger.info("dubbing_job.step.completed", { jobId, step: currentStep });
    const sourceLanguage = resolveSourceLanguage({
      requestedSourceLanguage: job.sourceLanguage,
      detectedSourceLanguage: transcription.detectedLanguageCode,
    });

    assertDifferentDubbingLanguages({
      sourceLanguage,
      targetLanguage: job.targetLanguage,
    });

    currentStep = "measure_source_audio";
    logger.info("dubbing_job.step.started", { jobId, step: currentStep });
    const sourceAudioDurationSeconds = await getMediaDuration(sourceAudioPath);
    logger.info("dubbing_job.step.completed", {
      jobId,
      step: currentStep,
      sourceAudioDurationSeconds,
    });

    currentStep = "segment_transcript_sentences";
    logger.info("dubbing_job.step.started", { jobId, step: currentStep });
    const sentenceSegments = segmentTranscriptSentences({
      segments: transcription.segments,
      languageCode: sourceLanguage,
      fallbackDurationSeconds: sourceAudioDurationSeconds,
    });

    if (sentenceSegments.length === 0) {
      throw new Error("Transcription did not produce any sentence segments");
    }

    logger.info("dubbing_job.step.completed", {
      jobId,
      step: currentStep,
      inputSegmentCount: transcription.segments.length,
      sentenceSegmentCount: sentenceSegments.length,
    });

    await updateDubbingJob(jobId, {
      transcriptionLanguage: sourceLanguage,
      transcriptJson: JSON.stringify(sentenceSegments),
    });

    currentStep = "clone_voice";
    logger.info("dubbing_job.step.started", { jobId, step: currentStep });
    const { voiceId } = await cloneVoice({
      jobId,
      sourceAudioPath,
      sourceLanguage,
      segments: sentenceSegments,
      tempDir,
    });
    logger.info("dubbing_job.step.completed", { jobId, step: currentStep });

    await updateDubbingJob(jobId, {
      voiceCloneId: voiceId,
    });

    currentStep = "translate_transcript";
    logger.info("dubbing_job.step.started", { jobId, step: currentStep });
    const translatedSegments = await translateTranscript({
      segments: sentenceSegments,
      sourceLanguage,
      targetLanguage: job.targetLanguage,
    });
    logger.info("dubbing_job.step.completed", { jobId, step: currentStep });

    await updateDubbingJob(jobId, {
      translationJson: JSON.stringify(translatedSegments),
    });

    currentStep = "synthesize_dubbed_audio";
    logger.info("dubbing_job.step.started", { jobId, step: currentStep });
    const { dubbedAudioPath, dubbedAudioKey } = await synthesizeDubbedAudio({
      jobId,
      sourceAudioPath,
      sourceAudioDurationSeconds,
      voiceId,
      targetLanguage: job.targetLanguage,
      segments: translatedSegments,
      tempDir,
    });
    logger.info("dubbing_job.step.completed", { jobId, step: currentStep });

    await updateDubbingJob(jobId, {
      dubbedAudioKey,
    });

    currentStep = "mux_dubbed_video";
    logger.info("dubbing_job.step.started", { jobId, step: currentStep });
    const { dubbedVideoKey, dubbedVideoUrl } = await muxDubbedVideo({
      jobId,
      sourceVideoPath,
      dubbedAudioPath,
      tempDir,
    });
    logger.info("dubbing_job.step.completed", { jobId, step: currentStep });

    await updateDubbingJob(jobId, {
      dubbedAudioKey,
      dubbedVideoKey,
      dubbedVideoUrl,
      status: "completed",
      errorMessage: null,
    });

    logger.info("dubbing_job.completed", { jobId });
  } catch (error) {
    const message = getUserSafeDubbingErrorMessage(error);

    logger.error("dubbing_job.failed", error, {
      jobId,
      step: currentStep,
    });

    try {
      await updateDubbingJob(jobId, {
        status: "failed",
        errorMessage: message,
      });
    } catch (updateError) {
      logger.error("dubbing_job.failed_persist_error", updateError, {
        jobId,
        step: currentStep,
        originalErrorMessage: message,
      });
    }

    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};
