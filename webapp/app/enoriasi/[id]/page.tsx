import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { deletePerson, updatePerson } from "../actions";

export const dynamic = "force-dynamic";

export default async function PersonEditPage({ params }: { params: { id: string } }) {
  let person: Record<string, any> | null = null;

  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("enoriasi")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      return (
        <main className="page">
          <p className="error">{error.message}</p>
        </main>
      );
    }
    person = data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <main className="page">
        <p className="error">Aplicația nu s-a putut conecta la baza de date: {message}</p>
      </main>
    );
  }

  if (!person) {
    notFound();
  }

  const updateWithId = updatePerson.bind(null, params.id);
  const deleteWithId = deletePerson.bind(null, params.id);

  return (
    <main className="page">
      <nav className="topnav">
        <Link href="/enoriasi">← Enoriași</Link>
      </nav>

      <h1>Editează enoriaș</h1>

      <form action={updateWithId} className="card-form">
        <label>
          Nume
          <input type="text" name="nume" defaultValue={person.nume} required />
        </label>
        <label>
          Prenume
          <input type="text" name="prenume" defaultValue={person.prenume} required />
        </label>
        <label>
          Data nașterii
          <input type="date" name="data_nasterii" defaultValue={person.data_nasterii} required />
        </label>
        <label>
          Domiciliu
          <input type="text" name="domiciliu" defaultValue={person.domiciliu ?? ""} />
        </label>
        <label>
          Mențiuni
          <input type="text" name="mentiuni" defaultValue={person.mentiuni ?? ""} />
        </label>
        <div className="actions-row">
          <button type="submit">Salvează modificările</button>
        </div>
      </form>

      <form action={deleteWithId} style={{ marginTop: 16 }}>
        <button type="submit" className="danger">
          Șterge acest enoriaș
        </button>
      </form>
    </main>
  );
}
