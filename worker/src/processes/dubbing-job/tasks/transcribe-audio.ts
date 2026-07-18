import { transcribeAudioFile } from "../../../lib/providers/sarvam.js";

type TranscribeAudioTaskInput = {
  sourceAudioPath: string;
};

export const transcribeAudio = async ({
  sourceAudioPath,
}: TranscribeAudioTaskInput) => {
  const transcription = await transcribeAudioFile(sourceAudioPath);
  const speakerIds = new Set(
    transcription.segments
      .map((segment) => segment.speakerId)
      .filter((speakerId): speakerId is string => Boolean(speakerId)),
  );

  if (speakerIds.size > 1) {
    throw new Error(
      `Single-speaker dubbing is enforced in this worker, but Sarvam detected ${speakerIds.size} speakers`,
    );
  }

  return transcription;
};
