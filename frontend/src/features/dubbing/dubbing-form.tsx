import {
  ChevronDown,
  Film,
  Languages,
  LoaderCircle,
  UploadCloud,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useId,
  useState,
} from "react";
import {
  type Control,
  Controller,
  type FieldError,
  type SubmitHandler,
} from "react-hook-form";
import { useSnackbar } from "@/app/providers/snackbar-context";
import { Select, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AUTO_SOURCE_LANGUAGE,
  LANGUAGES,
  type DubbingFormData,
} from "./dubbing-schema";
import { useDubbingForm } from "./use-dubbing-form";

const MAX_VIDEO_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE_MESSAGE = "Video file must be 50 MB or smaller";

export function DubbingForm() {
  const inputId = useId();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { showSnackbar } = useSnackbar();

  const { form, mutation } = useDubbingForm();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const validateVideoFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("video/")) {
      return "Please select a valid video file";
    }

    if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
      return MAX_VIDEO_FILE_SIZE_MESSAGE;
    }

    return null;
  }, []);

  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    const error = validateVideoFile(file);

    if (error) {
      setVideoFile(null);
      setFileError(
        error === "Please select a valid video file"
          ? "Please drop a valid video file"
          : error,
      );
      return;
    }

    if (!file) {
      return;
    }

    setVideoFile(file);
    setFileError(null);
  }, [validateVideoFile]);

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.currentTarget.value = "";
      const error = validateVideoFile(file);

      if (error) {
        setVideoFile(null);
        setFileError(error);
        return;
      }

      if (!file) {
        return;
      }

      setVideoFile(file);
      setFileError(null);
    },
    [validateVideoFile],
  );

  const clearFile = useCallback(() => {
    setVideoFile(null);
    setFileError(null);
  }, []);

  const onSubmit: SubmitHandler<DubbingFormData> = (values) => {
    if (!videoFile) {
      setFileError("Please select a video file before submitting");
      showSnackbar({
        message: "Attach a video file to begin the dubbing process.",
        variant: "error",
      });
      return;
    }

    const error = validateVideoFile(videoFile);

    if (error) {
      setFileError(error);
      showSnackbar({
        message: error,
        variant: "error",
      });
      return;
    }

    mutation.mutate({ ...values, videoFile }, {
      onSuccess: () => {
        setVideoFile(null);
        setFileError(null);
        showSnackbar({
          message: "Video uploaded successfully. Your recent jobs will refresh automatically.",
          variant: "success",
        });
      },
      onError: () => {
        showSnackbar({
          message: "Failed to submit the video. Verify the file and try again.",
          variant: "error",
        });
      },
    });
  };

  return (
    <form className="w-full border border-(--color-border) bg-(--color-surface)" onSubmit={handleSubmit(onSubmit)}>
      <DubbingFormHeader />
      <div className="grid border-t border-(--color-border) md:grid-cols-[1.35fr_0.65fr]">
        <VideoUploadDropzone inputId={inputId} videoFile={videoFile} isDragging={isDragging} fileError={fileError} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onFileSelect={handleFileSelect} onClearFile={clearFile} />
        <div className="flex flex-col border-t border-(--color-border) md:border-l md:border-t-0">
          <TargetLanguageField control={control} error={errors.targetLanguage} disabled={mutation.isPending} />
          <AdvancedLanguageSettings control={control} error={errors.sourceLanguage} disabled={mutation.isPending} showAdvanced={showAdvanced} onToggle={() => setShowAdvanced((value) => !value)} />
          <div className="mt-auto border-t border-(--color-border) p-4">
            <SubmitButton isPending={mutation.isPending} />
          </div>
        </div>
      </div>
    </form>
  );
}

  function DubbingFormHeader() {
  return (
    <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div><h2 className="text-base font-semibold tracking-[-0.01em] text-(--color-text)">Generate a dubbed version</h2><p className="mt-1 text-xs text-(--color-text-dim)">Single video, single target language</p></div>
      <p className="font-mono text-xs text-(--color-text-dim)">MP4 / MOV / WEBM · MAX 50 MB</p>
    </div>
  );
}

type VideoUploadDropzoneProps = {
  inputId: string;
  videoFile: File | null;
  isDragging: boolean;
  fileError: string | null;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent) => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
};

function VideoUploadDropzone({
  inputId,
  videoFile,
  isDragging,
  fileError,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onClearFile,
}: VideoUploadDropzoneProps) {
  return (
    <div>
      <div
        className={cn(
          "relative flex min-h-56 items-center justify-center overflow-hidden px-5 py-8 text-center transition md:min-h-72",
          isDragging && "border-(--color-accent) bg-[#eef0f6]",
          videoFile &&
            !isDragging &&
            "border-(--color-text) bg-(--color-panel)",
          !videoFile &&
            !isDragging &&
            "bg-(--color-surface) hover:bg-(--color-panel)",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {videoFile ? (
          <SelectedVideoFile videoFile={videoFile} onClearFile={onClearFile} />
        ) : (
          <EmptyVideoDropzone />
        )}
        <label className="absolute inset-0 cursor-pointer" htmlFor={inputId}>
          <span className="sr-only">Choose a video file</span>
        </label>
        <input
          aria-label="Choose a video file"
          id={inputId}
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={onFileSelect}
        />
      </div>
      <div className="flex min-h-8 items-center border-t border-(--color-border) px-3 py-1.5">
        {fileError ? (
          <p className="text-sm text-red-600">{fileError}</p>
        ) : (
          <span className="text-xs text-[var(--color-text-dim)]">Choose one source video</span>
        )}
      </div>
    </div>
  );
}

  function EmptyVideoDropzone() {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex size-11 items-center justify-center border border-(--color-border) bg-(--color-bg)"><UploadCloud className="size-4 text-[var(--color-text-dim)]" /></span>
      <div>
        <p className="text-base font-semibold text-[var(--color-text)]">
          Drop your completed video here
        </p>
        <p className="mt-1.5 text-sm text-[var(--color-text-dim)]">
          or click to browse files
        </p>
      </div>
    </div>
  );
}

function SelectedVideoFile({
  videoFile,
  onClearFile,
}: {
  videoFile: File;
  onClearFile: () => void;
}) {
  return (
    <div className="flex min-w-0 max-w-[80%] items-center gap-3 text-left">
      <div className="flex size-9 shrink-0 items-center justify-center border border-(--color-border) bg-white text-(--color-text-dim)">
        <Film className="size-4" />
      </div>
      <div className="min-w-0"><p className="truncate text-sm font-medium text-(--color-text)">{videoFile.name}</p><p className="mt-0.5 text-xs text-[var(--color-text-dim)]">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p></div>
      <button
        type="button"
        className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center text-[var(--color-text-dim)] transition hover:text-[var(--color-text)]"
        onClick={onClearFile}
      >
        <span className="sr-only">Remove selected video</span>
        <X className="size-3.5" />
      </button>
    </div>
  );
}

  function TargetLanguageField({
  control,
  error,
  disabled,
}: {
  control: Control<DubbingFormData>;
  error?: FieldError;
  disabled: boolean;
}) {
  return (
    <div className="px-4 py-4">
      <label
        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-dim)]"
        htmlFor="targetLanguage"
      >
        <Languages className="size-3.5" />
        Destination language
      </label>
      <Controller
        control={control}
        name="targetLanguage"
        render={({ field }) => (
          <Select
            id="targetLanguage"
            value={field.value}
            onValueChange={field.onChange}
            placeholder="Choose target language"
            error={Boolean(error)}
            disabled={disabled}
          >
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </Select>
        )}
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error.message}</p> : null}
    </div>
  );
}

function AdvancedLanguageSettings({
  control,
  error,
  disabled,
  showAdvanced,
  onToggle,
}: {
  control: Control<DubbingFormData>;
  error?: FieldError;
  disabled: boolean;
  showAdvanced: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t border-(--color-border)">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs font-medium text-(--color-text)"
        onClick={onToggle}
        aria-expanded={showAdvanced}
      >
        <span>Source language <span className="ml-1 font-normal text-(--color-text-dim)">{showAdvanced ? "" : "Auto-identify"}</span></span>
        <ChevronDown
          className={cn(
            "size-4 text-(--color-text-dim) transition",
            showAdvanced && "rotate-180",
          )}
        />
      </button>

      {showAdvanced ? (
        <SourceLanguageField control={control} error={error} disabled={disabled} />
      ) : (
        null
      )}
    </div>
  );
}

function SourceLanguageField({
  control,
  error,
  disabled,
}: {
  control: Control<DubbingFormData>;
  error?: FieldError;
  disabled: boolean;
}) {
  return (
    <div className="border-t border-(--color-border) px-3 py-3">
      <label
        className="mb-1.5 block text-xs font-medium text-[var(--color-text-dim)]"
        htmlFor="sourceLanguage"
      >
        Source language
      </label>
      <Controller
        control={control}
        name="sourceLanguage"
        render={({ field }) => (
          <Select
            id="sourceLanguage"
            value={field.value}
            onValueChange={field.onChange}
            placeholder="Source"
            error={Boolean(error)}
            disabled={disabled}
          >
            <SelectItem value={AUTO_SOURCE_LANGUAGE}>Auto-detect</SelectItem>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </Select>
        )}
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error.message}</p> : null}
    </div>
  );
}

  function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="inline-flex h-11 w-full items-center justify-center bg-[var(--color-text)] px-4 text-sm font-semibold text-[var(--color-surface)] transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <LoaderCircle className="size-4 animate-spin" />
          Uploading
        </span>
      ) : (
        "Begin processing"
      )}
    </button>
  );
}
