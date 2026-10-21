import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="p-8 text-slate-600">Checking session...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleToggleMode() {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register") {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        setError("Name must be at least 2 characters.");
        return;
      }
      if (trimmedName.length > 100) {
        setError("Name must not exceed 100 characters.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password.length > 72) {
        setError("Password must not exceed 72 characters.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === "login") {
        await login({ email: email.trim(), password });
      } else {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      }

      const destination = location.state?.from?.pathname;
      navigate(
        typeof destination === "string" && destination !== "/login"
          ? destination
          : "/dashboard",
        { replace: true },
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "Sign in to continue to your workspace."
              : "Sign up to start collaborating on projects and tasks."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {mode === "register" && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password {mode === "register" && <span className="font-normal text-slate-400">(min. 8 characters)</span>}
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : 1}
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? mode === "login"
              ? "Signing in..."
              : "Creating account..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>

        <div className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
