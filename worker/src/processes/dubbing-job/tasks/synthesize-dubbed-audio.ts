import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  getMediaDuration,
  mixDubbedSegments,
  normalizeAudioForMix,
  prepareAudioClipForTimeline,
} from "../../../lib/audio.js";
import { logger } from "../../../lib/logger.js";
import { synthesizeVoiceCloneSpeech } from "../../../lib/providers/smallest.js";
import {
  createDubbedAudioObjectKey,
  uploadAudioToR2,
} from "../../../lib/r2.js";
import { calculateTtsSpeed } from "../synthesis-timing.js";
import type { PreparedDubSegment, TranscriptSegment } from "../types.js";

type SynthesizeDubbedAudioTaskInput = {
  jobId: string;
  sourceAudioPath: string;
  sourceAudioDurationSeconds?: number;
  voiceId: string;
  targetLanguage: string;
  segments: TranscriptSegment[];
  tempDir: string;
};

type SynthesizeDubbedAudioTaskResult = {
  dubbedAudioPath: string;
  dubbedAudioKey: string;
};

export const synthesizeDubbedAudio = async ({
  jobId,
  sourceAudioPath,
  sourceAudioDurationSeconds,
  voiceId,
  targetLanguage,
  segments,
  tempDir,
}: SynthesizeDubbedAudioTaskInput): Promise<SynthesizeDubbedAudioTaskResult> => {
  const activeSegments = segments
    .map((segment) => ({
      segment,
      translatedText: segment.translatedText?.trim() ?? "",
      targetDurationSeconds: segment.endTimeSeconds - segment.startTimeSeconds,
    }))
    .filter(
      (entry) =>
        entry.translatedText.length > 0 && entry.targetDurationSeconds > 0,
    );

  if (activeSegments.length === 0) {
    throw new Error("No translated segments were available for dubbing synthesis");
  }

  const preparedSegments: PreparedDubSegment[] = [];

  for (const { segment, translatedText, targetDurationSeconds } of activeSegments) {
    const rawAudioPathStem = path.join(
      tempDir,
      `${jobId}.segment-${segment.index}.provider`,
    );
    const normalizedAudioPath = path.join(
      tempDir,
      `${jobId}.segment-${segment.index}.wav`,
    );
    const fittedAudioPath = path.join(
      tempDir,
      `${jobId}.segment-${segment.index}.fitted.wav`,
    );

    const synthesizedAudio = await synthesizeVoiceCloneSpeech({
      text: translatedText,
      voiceId,
      languageCode: targetLanguage,
      outputPathStem: rawAudioPathStem,
    });

    logger.info("dubbing_job.segment_synthesized", {
      jobId,
      segmentIndex: segment.index,
      contentType: synthesizedAudio.contentType,
      sizeBytes: synthesizedAudio.sizeBytes,
    });

    try {
      const rawProviderDurationSeconds = await getMediaDuration(
        synthesizedAudio.outputPath,
      );
      const ttsSpeed = calculateTtsSpeed({
        rawDurationSeconds: rawProviderDurationSeconds,
        targetDurationSeconds,
      });
      const fittedSynthesizedAudio =
        ttsSpeed === 1
          ? synthesizedAudio
          : await synthesizeVoiceCloneSpeech({
              text: translatedText,
              voiceId,
              languageCode: targetLanguage,
              speed: ttsSpeed,
              outputPathStem: rawAudioPathStem,
            });

      await normalizeAudioForMix(
        fittedSynthesizedAudio.outputPath,
        normalizedAudioPath,
      );

      const preparedAudio = await prepareAudioClipForTimeline({
        inputPath: normalizedAudioPath,
        outputPath: fittedAudioPath,
        targetDurationSeconds,
        minTempoFactor: 0.9,
        maxTempoFactor: 1.12,
      });

      preparedSegments.push({
        segmentIndex: segment.index,
        audioPath: fittedAudioPath,
        startTimeSeconds: segment.startTimeSeconds,
        endTimeSeconds: segment.endTimeSeconds,
        targetDurationSeconds,
        rawDurationSeconds: preparedAudio.rawDurationSeconds,
        providerRawDurationSeconds: rawProviderDurationSeconds,
        ttsSpeed,
        tempoFactor: preparedAudio.tempoFactor,
        fittedDurationSeconds: preparedAudio.fittedDurationSeconds,
        silencePaddingSeconds: preparedAudio.silencePaddingSeconds,
        wasTrimmed: preparedAudio.wasTrimmed,
      });

      logger.info("dubbing_job.segment_audio_prepared", {
        jobId,
        segmentIndex: segment.index,
        startTimeSeconds: segment.startTimeSeconds,
        endTimeSeconds: segment.endTimeSeconds,
        targetDurationSeconds,
        rawDurationSeconds: preparedAudio.rawDurationSeconds,
        providerRawDurationSeconds: rawProviderDurationSeconds,
        ttsSpeed,
        tempoFactor: preparedAudio.tempoFactor,
        fittedDurationSeconds: preparedAudio.fittedDurationSeconds,
        silencePaddingSeconds: preparedAudio.silencePaddingSeconds,
        wasTrimmed: preparedAudio.wasTrimmed,
      });
    } catch (error) {
      logger.error("dubbing_job.segment_audio_invalid", error, {
        jobId,
        segmentIndex: segment.index,
        rawAudioPath: synthesizedAudio.outputPath,
        contentType: synthesizedAudio.contentType,
        sizeBytes: synthesizedAudio.sizeBytes,
      });
      throw error;
    }
  }

  const dubbedAudioPath = path.join(tempDir, `${jobId}.dubbed.m4a`);
  const dubbedAudioKey = createDubbedAudioObjectKey(jobId);
  const totalDurationSeconds =
    sourceAudioDurationSeconds ?? (await getMediaDuration(sourceAudioPath));

  await mixDubbedSegments({
    outputPath: dubbedAudioPath,
    totalDurationSeconds,
    segments: preparedSegments,
  });

  const dubbedAudioBuffer = await readFile(dubbedAudioPath);

  await uploadAudioToR2(dubbedAudioKey, dubbedAudioBuffer, "audio/mp4");

  return {
    dubbedAudioPath,
    dubbedAudioKey,
  };
};
