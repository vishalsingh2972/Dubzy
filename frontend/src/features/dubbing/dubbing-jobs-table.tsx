import { AlertCircle, ChevronDown, Download, Languages, LoaderCircle, Trash2 } from "lucide-react";
import { type MouseEvent, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useSnackbar } from "@/app/providers/snackbar-context";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DUBBING_LANGUAGES, getDubbingLanguageName } from "./dubbing-languages";
import { useAddSourceVersion } from "./use-add-source-version";
import { useDeleteSourceVideo } from "./use-delete-source-video";
import {
  type DubbingJob,
  getDubbingJobDownloadUrl,
  type SourceVideo,
  useDubbingJobs,
} from "./use-dubbing-jobs";

const updatedTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const statusClasses = {
  pending: "ui-status ui-status-pending",
  processing: "ui-status ui-status-active",
  completed: "ui-status ui-status-complete",
  failed: "ui-status ui-status-failed",
} as const;

const isActive = (version: DubbingJob) =>
  version.status === "pending" || version.status === "processing";

const formatUpdatedTime = (value: string) =>
  updatedTimeFormatter.format(new Date(value));

export function DubbingJobsTable() {
  const { data: sources, isLoading, isError, error } = useDubbingJobs();
  const { showSnackbar } = useSnackbar();
  const sortedSources = useMemo(
    () =>
      (sources ?? []).toSorted(
        (first, second) =>
          new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
      ),
    [sources],
  );
  const hasActiveVersions = sortedSources.some((source) =>
    source.versions.some(isActive),
  );

  const handleDownload = (
    event: MouseEvent<HTMLAnchorElement>,
    versionId: string,
  ) => {
    event.preventDefault();
    window.location.assign(getDubbingJobDownloadUrl(versionId));
    showSnackbar({ message: "Download started for the language version.", variant: "success" });
  };

  return (
    <section aria-labelledby="source-videos-heading">
      <div className="flex flex-col gap-3 border-b border-(--color-border) pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="source-videos-heading" className="text-lg font-semibold tracking-[-0.015em] text-(--color-text)">Your original videos</h2>
          <p className="mt-1 text-sm text-(--color-text-dim)">Each source maintains its language variants in one place.</p>
        </div>
        {hasActiveVersions ? <span className="inline-flex items-center gap-1.5 text-xs text-(--color-text-dim)"><LoaderCircle className="size-3.5 animate-spin text-(--color-blue)" />Live refresh</span> : null}
      </div>

      {isLoading ? <State icon={<LoaderCircle className="size-4 animate-spin text-(--color-blue)" />} text="Fetching your videos" /> : null}
      {isError ? <State icon={<AlertCircle className="size-4 text-red-700" />} text={error instanceof Error ? error.message : "Unable to retrieve your videos"} /> : null}
      {!isLoading && !isError && sortedSources.length === 0 ? <State text="No videos uploaded yet. Your first video will show up here." /> : null}
      {!isLoading && !isError ? <div>{sortedSources.map((source) => <SourceGroup key={source.id} source={source} onDownload={handleDownload} />)}</div> : null}
    </section>
  );
}

function State({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return <div className="flex min-h-32 items-center justify-center gap-2 border-b border-(--color-border) py-7 text-sm text-(--color-text-dim)">{icon}{text}</div>;
}

function SourceGroup({ source, onDownload }: { source: SourceVideo; onDownload: (event: MouseEvent<HTMLAnchorElement>, versionId: string) => void }) {
  const active = source.versions.some(isActive);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMutation = useDeleteSourceVideo();
  const newestUpdate = source.versions[0]?.updatedAt ?? source.updatedAt;
  return (
    <details className="group border-b border-(--color-border)" open={active}>
      <summary className="flex cursor-pointer list-none items-center gap-3 py-4 marker:content-none sm:px-3">
        <ChevronDown className="size-4 shrink-0 text-(--color-text-dim) transition group-open:rotate-180" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold text-(--color-text)">{source.displayTitle}</h3>{active ? <span className="ui-status ui-status-active">processing</span> : null}</div>
          <p className="mt-1 text-xs text-(--color-text-dim)">{getDubbingLanguageName(source.sourceLanguage)} source · {source.versions.length} {source.versions.length === 1 ? "language variant" : "language variants"} · {active ? "Currently processing" : `Last updated ${formatUpdatedTime(newestUpdate)}`}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Add another language"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 border border-(--color-border) px-2.5 text-xs font-medium text-(--color-text) outline-none transition enabled:hover:border-(--color-text) focus-visible:ring-2 focus-visible:ring-(--color-blue) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={active}
            aria-describedby={active ? `source-actions-disabled-${source.id}` : undefined}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setAddDialogOpen(true);
            }}
          >
            <Languages className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Add another language</span>
            <span className="sm:hidden">Add language</span>
          </button>
          <button
            type="button"
            aria-label={`Delete ${source.displayTitle} and all language versions`}
            className="inline-flex size-8 shrink-0 items-center justify-center border border-red-200 text-red-700 outline-none transition enabled:hover:border-red-400 enabled:hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={active || deleteMutation.isPending}
            aria-describedby={active ? `source-actions-disabled-${source.id}` : undefined}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDeleteDialogOpen(true);
            }}
          >
            {deleteMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </summary>
      {active ? <p id={`source-actions-disabled-${source.id}`} className="px-3 pb-3 text-xs text-(--color-text-dim) sm:pl-10">Please wait for the current language variant to complete before adding another or removing this source.</p> : null}
      <div className="border-t border-(--color-border) bg-(--color-surface) px-3 sm:pl-10">
        {source.versions.map((version) => <VersionRow key={version.id} version={version} onDownload={onDownload} />)}
      </div>
      <AddLanguageDialog source={source} open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <DeleteSourceDialog source={source} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} mutation={deleteMutation} />
    </details>
  );
}

function DeleteSourceDialog({ source, open, onOpenChange, mutation }: { source: SourceVideo; open: boolean; onOpenChange: (open: boolean) => void; mutation: ReturnType<typeof useDeleteSourceVideo> }) {
  const { showSnackbar } = useSnackbar();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!mutation.isPending) {
      if (!nextOpen) mutation.reset();
      onOpenChange(nextOpen);
    }
  };

  const confirmDelete = () => {
    mutation.mutate(source.id, {
      onSuccess: () => {
        showSnackbar({ message: `${source.displayTitle} and all associated files have been permanently removed.`, variant: "success" });
        onOpenChange(false);
      },
      onError: () => {
        showSnackbar({ message: "Unable to delete the source. Please wait for any active processing to complete before retrying.", variant: "error" });
      },
    });
  };

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogContent
      closeDisabled={mutation.isPending}
      onEscapeKeyDown={(event) => { if (mutation.isPending) event.preventDefault(); }}
      onPointerDownOutside={(event) => { if (mutation.isPending) event.preventDefault(); }}
    >
      <DialogHeader>
        <DialogTitle>Remove source video?</DialogTitle>
        <DialogDescription>This action permanently deletes the original upload, all language variants, and every generated audio and video file associated with {source.displayTitle}. This operation cannot be reversed.</DialogDescription>
      </DialogHeader>
      {mutation.isError ? <p role="alert" className="text-sm leading-6 text-red-700">The source is still in your workspace. Wait for any active processing to finish and try again. If the problem continues, contact support.</p> : null}
      <DialogFooter>
        <button type="button" className="h-10 border border-(--color-border) px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45" disabled={mutation.isPending} onClick={() => handleOpenChange(false)}>Cancel</button>
        <button type="button" className="inline-flex h-10 items-center justify-center gap-2 bg-red-700 px-4 text-sm font-medium text-white outline-none transition hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45" disabled={mutation.isPending} onClick={confirmDelete}>{mutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}{mutation.isPending ? "Deleting…" : "Delete permanently"}</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function AddLanguageDialog({ source, open, onOpenChange }: { source: SourceVideo; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { form, mutation } = useAddSourceVersion();
  const { showSnackbar } = useSnackbar();
  const representedLanguages = new Map(source.versions.map((version) => [version.targetLanguage, version.status]));

  const handleOpenChange = (nextOpen: boolean) => {
    if (!mutation.isPending) {
      if (!nextOpen) form.reset();
      onOpenChange(nextOpen);
    }
  };

  const submit = form.handleSubmit(({ targetLanguage }) => {
    mutation.mutate({ sourceId: source.id, targetLanguage }, {
      onSuccess: () => {
        showSnackbar({ message: "Language variant initiated. Progress will update automatically.", variant: "success" });
        handleOpenChange(false);
      },
      onError: () => {
        showSnackbar({ message: "Failed to add this language variant. Please check the workspace and try again.", variant: "error" });
      },
    });
  });

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add another language variant</DialogTitle>
        <DialogDescription>Add a new language variant to {source.displayTitle} without re-uploading the source video.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-dim)">Original video</p>
          <p className="mt-1 text-sm font-medium text-(--color-text)">{source.displayTitle}</p>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-dim)" htmlFor={`source-language-${source.id}`}>Original language</label>
          <input id={`source-language-${source.id}`} className="mt-1 h-10 w-full border border-(--color-border) bg-(--color-panel) px-3 text-sm text-(--color-text-dim)" value={getDubbingLanguageName(source.sourceLanguage) ?? source.sourceLanguage} readOnly />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-dim)" htmlFor={`target-language-${source.id}`}>Destination language</label>
          <Controller control={form.control} name="targetLanguage" render={({ field }) => <select {...field} id={`target-language-${source.id}`} className="mt-1 h-10 w-full border border-(--color-border) bg-(--color-surface) px-3 text-sm" disabled={mutation.isPending}>
              <option value="">Select a target language</option>
              {DUBBING_LANGUAGES.map((language) => {
                const status = representedLanguages.get(language.code);
                const unavailable = Boolean(status) || language.code === source.sourceLanguage;
                const suffix = status === "failed" ? " — retry separately" : status ? " — already added" : language.code === source.sourceLanguage ? " — original language" : "";
                return <option key={language.code} value={language.code} disabled={unavailable}>{language.name}{suffix}</option>;
              })}
            </select>} />
          {form.formState.errors.targetLanguage ? <p className="mt-2 text-sm text-red-700">{form.formState.errors.targetLanguage.message}</p> : null}
          {source.versions.some((version) => version.status === "failed") ? <p className="mt-2 text-xs text-(--color-text-dim)">Failed variants must be retried through the separate retry option and cannot be added here.</p> : null}
        </div>
        {mutation.isError ? <p role="alert" className="text-sm text-red-700">The language variant could not be initiated. Refresh the workspace to see the current status.</p> : null}
      </div>
      <DialogFooter>
        <button type="button" className="h-10 border border-(--color-border) px-4 text-sm font-medium" disabled={mutation.isPending} onClick={() => handleOpenChange(false)}>Dismiss</button>
        <button type="button" className="inline-flex h-10 items-center justify-center gap-2 bg-(--color-text) px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45" disabled={!form.watch("targetLanguage") || mutation.isPending} onClick={() => void submit()}>{mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}{mutation.isPending ? "Initializing…" : "Start dubbing"}</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function VersionRow({ version, onDownload }: { version: DubbingJob; onDownload: (event: MouseEvent<HTMLAnchorElement>, versionId: string) => void }) {
  const canDownload = version.status === "completed" && Boolean(version.dubbedVideoKey);
  return <div className="flex flex-col gap-3 border-b border-(--color-border) py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-(--color-text)">{getDubbingLanguageName(version.targetLanguage)}</p><span className={statusClasses[version.status]}>{version.status}</span></div><p className="mt-1 font-mono text-xs text-(--color-text-dim)">Updated {formatUpdatedTime(version.updatedAt)}</p>{version.status === "failed" && version.errorMessage ? <p className="mt-2 text-sm text-red-700">{version.errorMessage}</p> : null}</div>
    {canDownload ? <a className="inline-flex h-8 w-fit items-center gap-1.5 border border-(--color-border) px-2.5 text-xs font-medium text-(--color-text) transition hover:border-(--color-text)" href={getDubbingJobDownloadUrl(version.id)} onClick={(event) => void onDownload(event, version.id)}><Download className="size-4" />Download</a> : isActive(version) ? <span className="inline-flex items-center gap-1.5 text-xs text-(--color-text-dim)"><LoaderCircle className="size-3.5 animate-spin text-(--color-blue)" />Processing</span> : null}
  </div>;
}
