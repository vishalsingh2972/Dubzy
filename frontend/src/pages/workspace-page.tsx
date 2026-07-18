import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DubbingForm } from "@/features/dubbing/dubbing-form";
import { DubbingJobsTable } from "@/features/dubbing/dubbing-jobs-table";
import { authClient } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/brand";
import { Brand } from "./landing-page";

export function WorkspacePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      queryClient.clear();
      navigate("/auth", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <header className="sticky top-0 z-20 border-b border-(--color-border) bg-(--color-bg)/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><Brand /><span className="hidden border-l border-(--color-border) pl-3 text-xs text-(--color-text-dim) sm:block">Creator studio</span></div>

          <div className="flex items-center gap-1">
            <button
            className="inline-flex min-h-11 items-center gap-1.5 px-1 text-xs font-medium text-(--color-text-dim) transition hover:text-(--color-text) disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-3.5" />
            )}
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1120px] flex-col gap-12 px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <section className="grid gap-8 border-b border-(--color-border) pb-9 lg:grid-cols-[1fr_23rem] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-(--color-accent)">Localization studio</p>
            <h1 className="mt-3 font-serif text-4xl leading-[0.98] tracking-[-0.035em] text-balance sm:text-5xl">Generate your next language variant.</h1>
            <p className="mt-5 max-w-xl leading-7 text-(--color-text-dim)">Submit a completed video. {APP_NAME} translates, voices, and produces a shareable output while preserving your original file.</p>
          </div>
          <ol className="grid grid-cols-3 divide-x divide-(--color-border) border-y border-(--color-border) py-3">
            <WorkspaceStep number="1" label="Upload" /><WorkspaceStep number="2" label="Select" /><WorkspaceStep number="3" label="Download" />
          </ol>
        </section>

        <section>
          <DubbingForm />
        </section>

        <DubbingJobsTable />
      </div>
    </main>
  );
}

function WorkspaceStep({ number, label }: { number: string; label: string }) {
  return <li className="flex flex-col gap-1 px-3 first:pl-0 last:pr-0 sm:px-4"><span className="font-mono text-xs text-(--color-muted)">{number.padStart(2, "0")}</span><span className="text-xs font-semibold text-(--color-text)">{label}</span></li>;
}
