import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/services/authService";

export default function SessionSignIn() {
  const { user, resumeSession, logout } = useAuth();
  const dialog = useRef(null);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await login({ phone, password });
      // A sign-out or revocation can close the dialog while sign-in is pending.
      if (dialog.current?.open) resumeSession(result.user, result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setPassword("");
      setPending(false);
    }
  };

  return (
    <dialog ref={dialog} aria-labelledby="session-sign-in-title" onCancel={(event) => event.preventDefault()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/60">
      <h2 id="session-sign-in-title" className="text-xl font-semibold">Your session expired</h2>
      <p className="mt-2 text-sm text-slate-600">Sign in with the same account to return to your work. Signing out discards unsaved changes.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-sm font-medium">
          Registered mobile number
          <input required type="tel" autoComplete="username" value={phone} onChange={(event) => setPhone(event.target.value)}
            disabled={pending} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input required type="password" autoComplete="current-password" maxLength={128} value={password}
            onChange={(event) => setPassword(event.target.value)} disabled={pending}
            className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={logout} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Sign out</button>
          <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Signing in…" : "Sign in again"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
