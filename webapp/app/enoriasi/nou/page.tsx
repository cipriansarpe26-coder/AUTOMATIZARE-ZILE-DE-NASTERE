import Link from "next/link";
import { createPerson } from "../actions";

export default function PersonNouPage() {
  return (
    <main className="page">
      <nav className="topnav">
        <Link href="/enoriasi">← Enoriași</Link>
      </nav>

      <h1>Adaugă enoriaș</h1>

      <form action={createPerson} className="card-form">
        <label>
          Nume
          <input type="text" name="nume" required />
        </label>
        <label>
          Prenume
          <input type="text" name="prenume" required />
        </label>
        <label>
          Data nașterii
          <input type="date" name="data_nasterii" required />
        </label>
        <label>
          Domiciliu
          <input type="text" name="domiciliu" />
        </label>
        <label>
          Mențiuni (opțional, ex: VASILE sau FLORII — separate prin virgulă)
          <input type="text" name="mentiuni" />
        </label>
        <button type="submit">Salvează</button>
      </form>
    </main>
  );
}
