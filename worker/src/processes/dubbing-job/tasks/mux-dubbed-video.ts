import path from "node:path";
import { readFile } from "node:fs/promises";
import { muxAudioIntoVideo } from "../../../lib/audio.js";
import {
  createDubbedVideoObjectKey,
  getStoredObjectUrl,
  uploadVideoToR2,
} from "../../../lib/r2.js";

type MuxDubbedVideoTaskInput = {
  jobId: string;
  sourceVideoPath: string;
  dubbedAudioPath: string;
  tempDir: string;
};

type MuxDubbedVideoTaskResult = {
  dubbedVideoKey: string;
  dubbedVideoUrl: string;
};

export const muxDubbedVideo = async ({
  jobId,
  sourceVideoPath,
  dubbedAudioPath,
  tempDir,
}: MuxDubbedVideoTaskInput): Promise<MuxDubbedVideoTaskResult> => {
  const outputPath = path.join(tempDir, `${jobId}.dubbed.mp4`);
  const dubbedVideoKey = createDubbedVideoObjectKey(jobId);

  await muxAudioIntoVideo({
    videoPath: sourceVideoPath,
    audioPath: dubbedAudioPath,
    outputPath,
  });

  const videoBuffer = await readFile(outputPath);

  await uploadVideoToR2({
    key: dubbedVideoKey,
    file: videoBuffer,
    contentType: "video/mp4",
  });

  return {
    dubbedVideoKey,
    dubbedVideoUrl: getStoredObjectUrl(dubbedVideoKey),
  };
};
