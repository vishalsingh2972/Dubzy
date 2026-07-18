import path from "node:path";
import { extractAudioFromVideo } from "../../../lib/audio.js";
import {
  createAudioObjectKey,
  downloadObjectToFile,
  uploadAudioToR2,
} from "../../../lib/r2.js";

type ExtractAudioTaskInput = {
  jobId: string;
  videoKey: string;
  tempDir: string;
};

type ExtractAudioTaskResult = {
  audioKey: string;
  sourceVideoPath: string;
  sourceAudioPath: string;
};

export const extractAudio = async ({
  jobId,
  videoKey,
  tempDir,
}: ExtractAudioTaskInput): Promise<ExtractAudioTaskResult> => {
  const inputPath = path.join(tempDir, `${jobId}.input`);
  const outputPath = path.join(tempDir, `${jobId}.mp3`);
  const audioKey = createAudioObjectKey(jobId);

  await downloadObjectToFile(videoKey, inputPath);
  const audioBuffer = await extractAudioFromVideo(inputPath, outputPath);
  await uploadAudioToR2(audioKey, audioBuffer);

  return {
    audioKey,
    sourceVideoPath: inputPath,
    sourceAudioPath: outputPath,
  };
};
