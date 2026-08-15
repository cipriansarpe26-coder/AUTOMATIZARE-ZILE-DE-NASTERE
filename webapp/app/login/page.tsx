import { loginAction } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { eroare?: string };
}) {
  return (
    <main className="auth-page">
      <form action={loginAction} className="auth-card">
        <h1>🔔 Enoriași</h1>
        <p className="muted">Introdu parola aplicației ca să continui.</p>
        {searchParams?.eroare === "1" && (
          <p className="error">Parolă greșită. Încearcă din nou.</p>
        )}
        {searchParams?.eroare === "config" && (
          <p className="error">
            Aplicația nu e configurată corect (lipsesc variabilele APP_PASSWORD /
            AUTH_SECRET).
          </p>
        )}
        <label>
          Parolă
          <input type="password" name="password" autoFocus required />
        </label>
        <button type="submit">Intră</button>
      </form>
    </main>
  );
}
