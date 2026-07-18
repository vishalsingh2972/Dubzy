import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { type FormEvent, useReducer } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/brand";
import { Brand } from "@/pages/landing-page";

type AuthMode = "sign-in" | "sign-up";

const authCopy = {
  "sign-in": {
    eyebrow: "Your studio",
    title: `Access your ${APP_NAME} account.`,
    action: "Sign in",
    alternate: "Create new account",
  },
  "sign-up": {
    eyebrow: "Fresh studio",
    title: "Set up your workspace.",
    action: "Create account",
    alternate: "Use existing account",
  },
} as const;

type AuthState = {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
};

const initialAuthState: AuthState = {
  mode: "sign-in",
  name: "",
  email: "",
  password: "",
  error: null,
  isSubmitting: false,
};

function authReducer(state: AuthState, update: Partial<AuthState>) {
  return { ...state, ...update };
}

export function AuthPanel() {
  const navigate = useNavigate();
  const [state, updateAuth] = useReducer(authReducer, initialAuthState);
  const { mode, name, email, password, error, isSubmitting } = state;
  const copy = authCopy[mode];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateAuth({ error: null, isSubmitting: true });

    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({
              email,
              password,
              rememberMe: true,
            })
          : await authClient.signUp.email({
              name,
              email,
              password,
            });

      if (result.error) {
        updateAuth({
          error: result.error.message ?? "Unable to authenticate",
        });
        return;
      }

      navigate("/auth", { replace: true });
    } catch {
      updateAuth({
        error: "Unable to authenticate. Check your details and try again.",
      });
    } finally {
      updateAuth({ isSubmitting: false });
    }
  };

  const switchMode = () => {
    updateAuth({
      mode: mode === "sign-in" ? "sign-up" : "sign-in",
      error: null,
    });
  };

  return (
    <main className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <section className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-[28rem] flex-col justify-between border-b border-(--color-border) px-5 py-6 md:px-8 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-10 lg:py-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
          </div>

          <div className="my-14 max-w-xl lg:my-auto">
            <p className="text-sm font-medium text-(--color-text-dim)">Your personal dubbing studio</p>
            <h1 className="mt-5 font-serif text-5xl leading-[0.96] tracking-[-0.035em] md:text-6xl">
              Your content remains linked to you.
            </h1>
            <p className="mt-5 max-w-md leading-7 text-(--color-text-dim)">
              Uploads, progress, and finished language versions all reside in one dedicated workspace.
            </p>
            <ul className="mt-8 space-y-3 border-t border-(--color-border) pt-6 text-sm text-(--color-text-dim)">
              <li className="flex items-center gap-3"><Check className="size-4" /> Completed versions stay organized within your account</li>
              <li className="flex items-center gap-3"><Check className="size-4" /> Processing status refreshes automatically</li>
              <li className="flex items-center gap-3"><Check className="size-4" /> Finished videos remain associated with your account</li>
            </ul>
          </div>

            <Link
              className="ui-button ui-button-secondary w-fit"
              to="/"
            >
              <ArrowLeft className="size-4" />
              Return to homepage
            </Link>
        </div>

        <div className="flex items-center justify-center bg-(--color-surface) px-5 py-12 md:px-8 lg:min-h-screen lg:px-12">
        <form
          className="w-full max-w-md border-t border-(--color-text) pt-7"
          onSubmit={handleSubmit}
        >
          <div className="mb-8">
            <div>
              <p className="text-sm font-medium text-(--color-text-dim)">
                {copy.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-[-0.02em] text-(--color-text)">
                {copy.title}
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {mode === "sign-up" && (
              <label className="block">
                <span className="mb-2 block font-mono text-xs font-semibold text-(--color-text-dim)">
                  Name
                </span>
                <span className="flex items-center gap-3 rounded-md border border-(--color-border) bg-(--color-bg) p-3 focus-within:border-(--color-blue) focus-within:ring-2 focus-within:ring-blue-100">
                  <User className="size-4 shrink-0 text-(--color-text-dim)" />
                  <input
                    aria-label="Name"
                    className="auth-input w-full bg-transparent text-sm text-(--color-text) outline-none placeholder:text-(--color-muted)"
                    value={name}
                    onChange={(event) => updateAuth({ name: event.target.value })}
                    placeholder="Your name"
                    required
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block font-mono text-xs font-semibold text-(--color-text-dim)">
                Email
              </span>
              <span className="flex items-center gap-3 rounded-md border border-(--color-border) bg-(--color-bg) p-3 focus-within:border-(--color-blue) focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="size-4 shrink-0 text-(--color-text-dim)" />
                <input
                  aria-label="Email"
                  className="auth-input w-full bg-transparent text-sm text-(--color-text) outline-none placeholder:text-(--color-muted)"
                  type="email"
                  value={email}
                  onChange={(event) => updateAuth({ email: event.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs font-semibold text-(--color-text-dim)">
                Password
              </span>
              <span className="flex items-center gap-3 rounded-md border border-(--color-border) bg-(--color-bg) p-3 focus-within:border-(--color-blue) focus-within:ring-2 focus-within:ring-blue-100">
                <Lock className="size-4 shrink-0 text-(--color-text-dim)" />
                <input
                  aria-label="Password"
                  className="auth-input w-full bg-transparent text-sm text-(--color-text) outline-none placeholder:text-(--color-muted)"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    updateAuth({ password: event.target.value })
                  }
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </span>
            </label>
          </div>

          {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

          {mode === "sign-up" ? (
            <p className="mt-5 text-sm text-(--color-text-dim)">
              New accounts can log in right away, but workspace access becomes available
              once an admin grants approval.
            </p>
          ) : null}

          <button
            className="ui-button ui-button-primary mt-8 flex w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            {copy.action}
          </button>

          <button
            className="mt-4 w-full rounded-md px-3 py-2 text-center text-sm font-semibold text-(--color-text-dim) transition hover:text-(--color-text)"
            onClick={switchMode}
            type="button"
          >
            {copy.alternate}
          </button>
        </form>
        </div>
      </section>
    </main>
  );
}
