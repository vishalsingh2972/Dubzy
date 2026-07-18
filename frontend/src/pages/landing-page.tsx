import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  Film,
  Languages,
  Mic2,
  Play,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@/lib/brand";

const stages = [
  { label: "Source", value: "English", icon: UploadCloud },
  { label: "Translate", value: "Hindi", icon: Languages },
  { label: "Voice", value: "Natural", icon: Mic2 },
  { label: "Export", value: "1080p", icon: Download },
] as const;

const timeline = [
  { width: "18%", opacity: "opacity-100" },
  { width: "27%", opacity: "opacity-55" },
  { width: "21%", opacity: "opacity-100" },
  { width: "30%", opacity: "opacity-75" },
] as const;

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-(--color-bg) text-(--color-text)">
      <nav className="landing-nav mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8 lg:px-10">
        <Brand />
        <div className="flex items-center gap-2 sm:gap-5">
          <a className="hidden text-sm text-(--color-text-dim) transition hover:text-(--color-text) sm:block" href="#how-it-works">How it works</a>
          <Link className="text-sm font-medium transition hover:text-(--color-text-dim)" to="/auth">Sign in</Link>
          <Link className="ui-button ui-button-primary min-h-11 px-3 sm:px-4" to="/auth"><span className="sm:hidden">Start</span><span className="hidden sm:inline">Start a project</span></Link>
        </div>
      </nav>

      <section className="landing-hero mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:px-10 lg:pt-24">
        <div className="relative z-10 max-w-xl">
          <p className="reveal-up flex items-center gap-2 text-sm font-medium text-(--color-text-dim)">
            <AudioLines className="size-4" /> Seamless Indian-language video dubbing, simplified
          </p>
            <h1 className="landing-title reveal-up mt-6 font-serif text-[clamp(3.5rem,7vw,5.8rem)] leading-[0.92] tracking-[-0.04em]" style={{ animationDelay: "70ms" }}>
            Single video.<br />Countless Indian voices.
          </h1>
          <p className="reveal-up mt-7 max-w-lg text-lg leading-8 text-(--color-text-dim)" style={{ animationDelay: "140ms" }}>
            Convert any completed video into authentic Hindi, Tamil, Telugu, Bengali, Marathi, or other Indian-language versions—fully translated, professionally voiced, and ready to distribute from a single streamlined workspace.
          </p>
          <div className="reveal-up mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "210ms" }}>
            <Link className="ui-button ui-button-primary min-h-11 px-5" to="/auth">Dub your first video <ArrowRight className="size-4" /></Link>
            <a className="inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold" href="#studio-preview"><Play className="size-4 fill-current" /> See the workflow</a>
          </div>
          <p className="reveal-up mt-6 flex items-center gap-2 text-sm text-(--color-text-dim)" style={{ animationDelay: "250ms" }}>
            <Check className="size-4" /> Ten Indian languages covered. No middlemen or complicated editing workflows.
          </p>
        </div>

        <StudioPreview />
      </section>

      <section className="border-y border-(--color-border) bg-(--color-surface)" id="how-it-works">
        <div className="mx-auto grid max-w-7xl md:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between border-b border-(--color-border) px-5 py-12 md:border-b-0 md:border-r md:px-8 md:py-16 lg:px-10">
            <div>
              <p className="text-sm font-medium text-(--color-accent)">From upload to Indian viewers</p>
              <h2 className="mt-4 max-w-md font-serif text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl">Preserve your edit. Connect in their language.</h2>
            </div>
            <p className="mt-10 max-w-sm leading-7 text-(--color-text-dim)">{APP_NAME} maintains a straightforward workflow, enabling you to produce Indian-language content without mastering complex editing software.</p>
          </div>

          <ol className="divide-y divide-(--color-border)">
            <ProcessRow number="01" title="Submit the final cut" copy="Upload the video you already publish. Your original remains untouched." icon={Film} />
            <ProcessRow number="02" title="Pick your Indian language" copy={`Select the source and target languages; ${APP_NAME} handles the translation and voiceover.`} icon={Languages} />
            <ProcessRow number="03" title="Exit with a shareable file" copy="Monitor processing in the workspace, then download the finished video." icon={Download} />
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div>
            <p className="font-serif text-4xl leading-[1.03] tracking-[-0.03em] sm:text-5xl">Built for content India will connect with.</p>
            <p className="mt-6 max-w-md leading-7 text-(--color-text-dim)">Whether you're explaining ideas or sharing narratives, the interface remains unobtrusive and keeps your Indian-language content progressing.</p>
          </div>
          <div className="border-t border-(--color-border)">
            <AudienceRow icon={Users} title="Independent creators" copy="Deliver completed essays, tutorials, or films to audiences throughout India in their preferred language." />
            <AudienceRow icon={BookOpen} title="Educators" copy="Simplify lessons for diverse classrooms and learners across India with multilingual content." />
          </div>
        </div>
      </section>

      <section className="bg-(--color-text) text-(--color-surface)">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-5 py-16 md:flex-row md:items-end md:px-8 md:py-20 lg:px-10">
          <div>
            <p className="text-sm text-white/65">Your upcoming viewers are already in India.</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.02] tracking-[-0.03em] sm:text-6xl">Let them experience your content in their native language.</h2>
          </div>
          <Link className="inline-flex min-h-12 shrink-0 items-center gap-3 bg-white px-5 text-sm font-semibold text-(--color-text) transition hover:bg-(--color-panel)" to="/auth">Start a project <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-(--color-text-dim) sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-10">
        <Brand />
          <p>Indian-language video dubbing solutions for independent creators and educators.</p>
      </footer>
    </main>
  );
}

function StudioPreview() {
  return (
    <div className="reveal-up relative" id="studio-preview" style={{ animationDelay: "280ms" }}>
      <div className="absolute -inset-6 -z-10 bg-(--color-panel-strong) opacity-75 [clip-path:polygon(8%_0,100%_0,100%_88%,92%_100%,0_100%,0_12%)]" />
      <div className="border border-(--color-text) bg-(--color-surface)">
        <div className="flex items-center justify-between border-b border-(--color-border) px-4 py-3">
          <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-(--color-accent)" /><span className="text-xs font-semibold">New dubbing job</span></div>
          <span className="font-mono text-xs text-(--color-muted)">studio / 01</span>
        </div>
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-(--color-video) p-5 text-white md:min-h-[22rem]">
            <div className="flex items-center justify-between text-xs text-white/60"><span>lesson-final.mp4</span><span>04:18</span></div>
            <div className="relative z-10 mx-auto flex size-14 items-center justify-center rounded-full border border-white/30 bg-white/5"><Play className="ml-0.5 size-5 fill-current" /></div>
            <div>
              <div className="mb-3 flex items-end gap-1" aria-hidden="true">
                {[12, 28, 18, 36, 24, 42, 16, 34, 22, 38, 14, 30, 20, 40, 18, 28, 12, 32, 16, 24].map((height, index) => <span className="w-full bg-white/50" key={index} style={{ height }} />)}
              </div>
              <div className="h-0.5 bg-white/20"><div className="h-full w-[62%] bg-white" /></div>
            </div>
          </div>
          <div className="flex flex-col border-t border-(--color-border) md:border-l md:border-t-0">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return <div className="flex items-center gap-3 border-b border-(--color-border) px-4 py-4" key={stage.label}><span className="flex size-8 items-center justify-center bg-(--color-panel)"><Icon className="size-3.5 text-(--color-text-dim)" /></span><div><p className="text-xs text-(--color-muted)">{stage.label}</p><p className="mt-0.5 text-sm font-medium">{stage.value}</p></div>{index < 3 ? <ChevronRight className="ml-auto size-3.5 text-(--color-muted)" /> : <Check className="ml-auto size-3.5 text-(--color-text-dim)" />}</div>;
            })}
            <div className="mt-auto p-4">
              <div className="flex gap-1" aria-hidden="true">{timeline.map((item, index) => <span className={`${item.opacity} h-1.5 bg-(--color-accent)`} key={index} style={{ width: item.width }} />)}</div>
              <Link className="mt-4 flex h-10 w-full items-center justify-center gap-2 bg-(--color-text) text-xs font-semibold text-white" to="/auth"><Sparkles className="size-3.5" /> Start processing</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-3 flex items-center gap-2 border border-(--color-border) bg-(--color-bg) px-3 py-2 text-xs font-medium sm:-left-5"><span className="size-1.5 rounded-full bg-(--color-success)" /> Original file unchanged</div>
    </div>
  );
}

function ProcessRow({ number, title, copy, icon: Icon }: { number: string; title: string; copy: string; icon: typeof Film }) {
  return <li className="group grid gap-5 px-5 py-8 transition hover:bg-(--color-panel) sm:grid-cols-[3rem_1fr_auto] sm:items-start md:px-8 lg:px-10"><span className="font-mono text-xs text-(--color-muted)">{number}</span><div><h3 className="text-lg font-semibold tracking-[-0.015em]">{title}</h3><p className="mt-2 max-w-lg leading-7 text-(--color-text-dim)">{copy}</p></div><Icon className="hidden size-5 text-(--color-text-dim) transition group-hover:translate-x-1 sm:block" /></li>;
}

function AudienceRow({ title, copy, icon: Icon }: { title: string; copy: string; icon: typeof Users }) {
  return <div className="grid gap-5 border-b border-(--color-border) py-8 sm:grid-cols-[3rem_0.7fr_1.3fr] sm:items-start"><span className="flex size-9 items-center justify-center bg-(--color-panel)"><Icon className="size-4 text-(--color-text-dim)" /></span><h3 className="text-lg font-semibold">{title}</h3><p className="max-w-xl leading-7 text-(--color-text-dim)">{copy}</p></div>;
}

export function Brand() {
  return <Link className="flex items-center gap-2 text-(--color-text)" to="/"><span className="brand-mark"><img src="/src/assets/dubzy-logo.svg" alt="Dubzy" className="size-8" /></span><span className="text-sm font-semibold tracking-[-0.02em]">{APP_NAME}</span></Link>;
}
