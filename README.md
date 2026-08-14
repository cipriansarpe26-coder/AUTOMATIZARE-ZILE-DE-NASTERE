# Automatizare Zile de Naștere & Onomastici (parohie)

Aplicație Python care citește `ZILE.xlsx`, calculează cine are ziua de
naștere sau onomastica **mâine** sau **peste exact o săptămână** și trimite
**un singur mesaj WhatsApp combinat** prin Meta WhatsApp Cloud API.

## ⚠️ Date personale — ATENȚIE OBLIGATORIE

`ZILE.xlsx` conține nume, adrese și date de naștere ale enoriașilor unei
parohii. **Fișierul NU este și NU trebuie pus în git** — e deja în
`.gitignore`.

**Acest repository (`AUTOMATIZARE-ZILE-DE-NASTERE`) este momentan PUBLIC pe
GitHub.** Asta nu afectează `ZILE.xlsx` (nu e comis niciodată), dar:

- Dacă rulezi **doar local**, nu ai nicio problemă — fișierul stă pe
  calculatorul tău, nu ajunge niciodată în repo.
- Dacă vrei să rulezi prin **GitHub Actions**, datele trebuie urcate ca
  **secret criptat** (vezi mai jos) — GitHub Secrets nu sunt vizibile în
  cod, în loguri sau de vizitatori, nici pe repo public. E totuși o
  practică mai sigură să faci repo-ul **privat** dacă poți (Settings →
  General → Danger Zone → Change visibility), ca strat suplimentar de
  protecție.

## Structura fișierului ZILE.xlsx

Foaia `Sheet1`, coloane în ordine:

| Coloană | Conținut |
|---|---|
| A | `NUME` (nume de familie) |
| B | `PRENUME` |
| C | `DATA NAȘTERII` (dată completă) — sursa de adevăr |
| D | `luna` — coloană auxiliară, ignorată de aplicație |
| E | `DOMICILIUL` |
| F | `MENȚIUNI` — opțional, unul sau mai multe nume de sfinți/marcaje separate prin virgulă (ex: `VASILE`, `ION`, `FLORII`) |

Rândurile fără dată de naștere validă în coloana C sunt ignorate automat.

## Reguli de onomastică (fixe, confirmate)

```python
FIXED_SAINTS = {
    "VASILE": (1, 1),
    "ION": (1, 7),
    "GABRIEL": (3, 26),
    "GHEORGHE": (4, 23),
    "CONSTANTIN": (5, 21),
    "NICOLAE": (12, 6),
    "MARIA": (8, 15),
}
```

Plus `FLORII` — dată mobilă, calculată ca Duminica dinaintea Paștelui
Ortodox (algoritmul Meeus + offset de 13 zile). Verificat: Paște Ortodox
2026 = 12 aprilie → Florii 2026 = 5 aprilie.

Dacă o persoană are o valoare în `MENȚIUNI`, numele de sfânt e afișat și
lângă intrarea de zi de naștere (dacă are ziua de naștere mâine/peste o
săptămână), chiar dacă nu e chiar ziua onomastică respectivă.

## Instalare locală

```bash
pip install -r requirements.txt
cp .env.example .env
# editează .env și pune META_PHONE_NUMBER_ID / META_ACCESS_TOKEN reale
```

Pune fișierul `ZILE.xlsx` în directorul proiectului (sau indică altă cale
cu `--file` / variabila de mediu `EXCEL_FILE_PATH`).

## Rulare

**Test fără a trimite nimic real (obligatoriu înainte de prima rulare reală):**

```bash
python main.py --dry-run
```

Acest mod calculează și printează mesajul, dar nu face niciun apel către
WhatsApp — sigur de folosit oricând.

**Test pe o dată specifică** (util pentru Florii, treceri peste an etc.):

```bash
python main.py --dry-run --date 2026-04-04
python main.py --dry-run --date 2025-12-31
```

**Rulare reală** (trimite mesajul pe WhatsApp dacă e ceva de anunțat):

```bash
python main.py
```

Dacă nu e nimic de anunțat nici mâine, nici peste o săptămână, aplicația
**nu trimite niciun mesaj** (nu trimite mesaje goale).

## Rulare automată zilnică

### Opțiunea A — local (recomandat dacă nu vrei să urci datele nicăieri)

Programează `python main.py` să ruleze zilnic la 08:00 prin:
- **cron** (Linux/Mac): `0 8 * * * cd /calea/catre/proiect && /usr/bin/python3 main.py`
- **Task Scheduler** (Windows)

Nu e nevoie de GitHub Actions și fișierul `ZILE.xlsx` nu părăsește niciodată
calculatorul tău.

### Opțiunea B — GitHub Actions

Workflow-ul `.github/workflows/notificari.yml` rulează zilnic la **05:00
UTC**. Din cauza orei de vară/iarnă din România:
- **vara** (ora de vară, ~ultima duminică din martie → ultima duminică din
  octombrie): 05:00 UTC = **08:00** România ✅
- **iarna**: 05:00 UTC = **07:00** România (cu o oră mai devreme)

Dacă vrei exact 08:00 tot anul, schimbă manual expresia cron în fișierul
workflow de două ori pe an (comentariile din fișier explică exact ce să
schimbi), sau acceptă diferența de o oră iarna.

**Configurare secrete** (Settings → Secrets and variables → Actions →
New repository secret):

1. `META_PHONE_NUMBER_ID` — Phone Number ID din Meta for Developers.
2. `META_ACCESS_TOKEN` — access token din Meta for Developers.
3. `ZILE_XLSX_BASE64` — conținutul `ZILE.xlsx` codificat base64 (așa se
   trimit datele fără a le pune vreodată în cod sursă/istoricul git):

   ```bash
   # Linux/Mac:
   base64 -i ZILE.xlsx | tr -d '\n' | pbcopy   # Mac, copiază direct în clipboard
   base64 -w0 ZILE.xlsx > ZILE.xlsx.b64        # Linux, apoi deschide fișierul .b64 și copiază conținutul

   # Windows (PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("ZILE.xlsx")) | Set-Clipboard
   ```

   Lipește rezultatul ca valoare a secretului `ZILE_XLSX_BASE64`.

   ⚠️ Când actualizezi lista de enoriași, trebuie să reîncarci acest secret
   cu noua versiune codificată.

Poți testa workflow-ul manual din tab-ul **Actions → Notificari zile de
nastere si onomastici → Run workflow**, fără să aștepți programarea.

## Testare & verificare înainte de trimiterea reală

Aplicația a fost testată cu `--dry-run` pe mai multe date, folosind date
sintetice, pentru a verifica:
- calculul corect al vârstei și al datei viitoare de naștere;
- trecerea peste sfârșitul anului (`--date 2025-12-31` → detectează corect
  1 și 7 ianuarie anul următor);
- calculul Floriilor ca dată mobilă (`--date 2026-04-04` → Florii
  05.04.2026);
- ignorarea rândurilor fără dată de naștere validă;
- persoane care au ziua de naștere ȘI onomastica în aceeași zi (apar în
  ambele secțiuni, 🎂 și ⛪);
- lipsa oricărui mesaj trimis când nu e nimic de anunțat.

**Nu rula fără `--dry-run` până nu verifici tu însuți mesajul de test.**

## Fișiere din proiect

- `main.py` — logica completă (citire Excel, calcul date, compunere mesaj, trimitere)
- `.env.example` — placeholder pentru variabilele de mediu necesare
- `requirements.txt` — dependințe Python
- `.github/workflows/notificari.yml` — rulare automată zilnică prin GitHub Actions
- `.gitignore` — exclude `ZILE.xlsx` și `.env` din git
