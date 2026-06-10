# 🥦 Ortofrutta Brescia — Web App

Applicazione web per la gestione degli ordini di Ortofrutta Brescia. Permette ai clienti di ordinare prodotti freschi online e al titolare di gestire ordini, prodotto e utenti da un pannello di amministrazione dedicato.

---

## Indice

- [Tecnologie utilizzate](#tecnologie-utilizzate)
- [Funzionalità principali](#funzionalità-principali)
- [Struttura del progetto](#struttura-del-progetto)
- [Schema del database](#schema-del-database)
- [Variabili d'ambiente](#variabili-dambiente)
- [Installazione e avvio](#installazione-e-avvio)
- [Compatibilità multi-piattaforma](#compatibilità-multi-piattaforma)
- [Come funziona](#come-funziona)
- [Deploy](#deploy)

---

## Tecnologie utilizzate

### Frontend
| Tecnologia | Versione | Ruolo |
|---|---|---|
| [React](https://react.dev) | 19.2.5 | Libreria UI principale |
| [React Router](https://reactrouter.com) | 6.25.0 | Routing client-side (SPA) |
| [Vite](https://vite.dev) | 8.0.10 | Build tool e dev server con Hot Module Replacement |
| [Tailwind CSS](https://tailwindcss.com) | 3.4.3 | Stili utility-first, design responsive |
| [PostCSS](https://postcss.org) + Autoprefixer | 8.4.38 | Processing CSS e compatibilità cross-browser |

### Backend e Database
| Tecnologia | Versione | Ruolo |
|---|---|---|
| [Supabase](https://supabase.com) | 2.46.1 | Database PostgreSQL, autenticazione, storage file |
| [Netlify Functions](https://www.netlify.com/products/functions/) | — | Funzioni serverless per operazioni privilegiate (service role) |

### Generazione PDF
| Tecnologia | Versione | Ruolo |
|---|---|---|
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | Generazione ricevute PDF lato client |
| [React PDF](https://react-pdf.org) | 10.4.1 | Preview PDF nel browser |

### Utilità
| Tecnologia | Versione | Ruolo |
|---|---|---|
| [date-fns](https://date-fns.org) | 3.6.0 | Manipolazione e formattazione date (locale italiano) |

### Dev Tools
| Tecnologia | Versione | Ruolo |
|---|---|---|
| ESLint | 10.2.1 | Linting e qualità del codice |
| @vitejs/plugin-react | 6.0.1 | React Fast Refresh in sviluppo |

---

## Funzionalità principali

### Per il Cliente
- **Ordini**: seleziona la data di consegna tramite calendario, aggiungi prodotti con quantità e tipologia (es. kg, cassetta, pezzo) usando l'autocompletamento
- **Storico ordini**: visualizza tutti gli ordini effettuati, filtrabili per data
- **Modifica ordini**: possibilità di modificare un ordine fino alle 02:00 del giorno di consegna
- **Riordino rapido**: replica un ordine precedente con un click
- **PDF ricevute**: genera e scarica la ricevuta PDF di ogni ordine
- **Login flessibile**: accesso tramite email+password oppure username+password

### Per il Titolare (Admin)
- **Dashboard statistiche**: numero ordini oggi, prodotti a catalogo, clienti registrati
- **Gestione ordini**: visualizza gli ordini per data con selettore settimanale orizzontale, ricerca per cliente, segna come completato, modifica prodotti, elimina
- **Gestione prodotti**: aggiungi, modifica, attiva/disattiva ed elimina prodotti dal catalogo; ogni prodotto ha tipologie personalizzabili (es. "kg;pezzo;cassetta")
- **Gestione utenti**: crea account clienti o titolari, modifica profili, elimina utenti (con eliminazione a cascata degli ordini)
- **PDF automatici**: ogni ordine aggiornato rigenera automaticamente il PDF e lo salva su Supabase Storage

---

## Struttura del progetto

```
OrtofruttaBrescia/          ← root del repository git
├── README.md
└── ortofrutta/             ← cartella principale dell'app
    ├── public/
    │   ├── Ortofrutta.png  ← logo / icona PWA
    │   ├── manifest.json   ← manifest Progressive Web App
    │   └── sw.js           ← Service Worker (offline support)
    ├── src/
    │   ├── main.jsx        ← entry point React
    │   ├── App.jsx         ← router e layout principale
    │   ├── pages/          ← pagine (una per route)
    │   │   ├── Landing.jsx         → / (home pubblica)
    │   │   ├── Login.jsx           → /login
    │   │   ├── Dashboard.jsx       → /dashboard (cliente)
    │   │   ├── AdminDashboard.jsx  → /admin (titolare)
    │   │   ├── AdminOrdersPage.jsx → /ordini (titolare)
    │   │   ├── Prodotti.jsx        → /prodotti (titolare)
    │   │   ├── Utenti.jsx          → /utenti (titolare)
    │   │   └── NotFound.jsx        → * (404)
    │   ├── components/     ← componenti riutilizzabili
    │   │   ├── Navigation.jsx          (barra di navigazione)
    │   │   ├── ProtectedRoute.jsx      (protezione route per ruolo)
    │   │   ├── AddProductForm.jsx      (form aggiunta prodotto all'ordine)
    │   │   ├── ProductAutocomplete.jsx (autocomplete ricerca prodotti)
    │   │   ├── CalendarPicker.jsx      (selezione data ordine)
    │   │   ├── HorizontalWeekSelector.jsx (selettore settimana admin)
    │   │   ├── OrderSummary.jsx        (riepilogo ordine prima della conferma)
    │   │   ├── OrderItemCard.jsx       (singola riga prodotto nell'ordine)
    │   │   ├── OrdersHistory.jsx       (storico ordini cliente)
    │   │   ├── OrdersForDayList.jsx    (lista ordini per data, admin)
    │   │   ├── AdminOrderCard.jsx      (card ordine nella vista admin)
    │   │   ├── EditOrderModal.jsx      (modale modifica ordine, admin)
    │   │   └── PDFPreviewModal.jsx     (preview PDF nel browser)
    │   ├── context/
    │   │   └── AuthContext.jsx  ← stato autenticazione globale (React Context)
    │   ├── hooks/
    │   │   └── useAuth.js       ← hook per accedere al contesto auth
    │   ├── services/            ← layer di accesso dati
    │   │   ├── supabaseClient.js    (inizializzazione client Supabase)
    │   │   ├── authService.js       (login, logout, sessione)
    │   │   ├── ordiniService.js     (CRUD ordini e dettagli)
    │   │   ├── prodottiService.js   (CRUD prodotti → Netlify functions)
    │   │   ├── profiliService.js    (profili utente)
    │   │   ├── netlifyApi.js        (chiamate alle Netlify functions con JWT)
    │   │   └── pdfStorageService.js (upload/download PDF su Storage)
    │   └── utils/               ← funzioni di utilità
    │       ├── constants.js     (ruoli, stati ordine, tipologie default)
    │       ├── formatters.js    (formattazione date, valute, quantità)
    │       ├── validators.js    (validazione form)
    │       └── pdfGenerator.js  (generazione PDF con jsPDF)
    ├── netlify/
    │   └── functions/           ← funzioni serverless Netlify
    │       ├── create-user.js
    │       ├── update-user.js
    │       ├── delete-user.js
    │       ├── list-clients.js
    │       ├── create-product.js
    │       ├── update-product.js
    │       ├── update-product-status.js
    │       ├── delete-product.js
    │       └── login-by-username.js
    ├── .env.local              ← variabili d'ambiente (NON committare)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── index.html
```

---

## Schema del database

Il database è PostgreSQL ospitato su Supabase con Row-Level Security (RLS) abilitata.

### Tabelle

#### `profili` — profili utente
| Colonna | Tipo | Note |
|---|---|---|
| `id` | UUID (PK) | corrisponde a `auth.users.id` |
| `nome` | TEXT | nome del cliente o titolare |
| `ruolo` | TEXT | `'cliente'` oppure `'titolare'` |
| `created_at` | TIMESTAMP | |

#### `prodotti` — catalogo prodotti
| Colonna | Tipo | Note |
|---|---|---|
| `id` | UUID (PK) | |
| `nome` | TEXT | nome del prodotto |
| `tipologie_possibili` | TEXT | valori separati da `;` (es. `kg;pezzo;cassetta`) |
| `attivo` | BOOLEAN | se `false` il prodotto non è visibile ai clienti |
| `created_at` | TIMESTAMP | |

#### `ordini` — ordini
| Colonna | Tipo | Note |
|---|---|---|
| `id` | UUID (PK) | |
| `cliente_id` | UUID (FK → profili) | |
| `data_ordine` | DATE | data di consegna richiesta |
| `data_creazione` | TIMESTAMP | quando è stato creato l'ordine |
| `completato` | BOOLEAN | `false` = in attesa, `true` = evaso |

#### `dettagli_ordine` — righe prodotto per ogni ordine
| Colonna | Tipo | Note |
|---|---|---|
| `id` | UUID (PK) | |
| `ordine_id` | UUID (FK → ordini) | |
| `prodotto_id` | UUID (FK → prodotti, nullable) | null se prodotto custom |
| `nome_custom` | TEXT (nullable) | nome libero se non è un prodotto a catalogo |
| `quantita` | NUMERIC | |
| `tipologia` | TEXT | es. `kg`, `pezzo`, `cassetta` |

#### Storage Bucket `ordini`
I PDF generati vengono salvati nel path: `ordini/{cliente_id}/{ordine_id}.pdf`

---

## Variabili d'ambiente

Crea il file `ortofrutta/.env.local` con le seguenti variabili:

```env
# URL del progetto Supabase
VITE_SUPABASE_URL=https://<tuo-progetto>.supabase.co

# Chiave pubblica anonima di Supabase (sicura da esporre nel browser)
VITE_SUPABASE_ANON_KEY=<anon-key>

# Chiave service role di Supabase (usata SOLO nelle Netlify Functions, mai nel browser)
VITE_SERVICE_ROLE_KEY=<service-role-key>

# URL base delle Netlify Functions (in sviluppo locale con netlify dev)
VITE_NETLIFY_FUNCTIONS_URL=http://localhost:3000/.netlify/functions
```

> **Attenzione**: non committare mai `.env.local` su git. Contiene chiavi segrete. Il file è già incluso nel `.gitignore` di default di Vite.

In produzione (deploy su Netlify), le variabili vanno configurate nel pannello **Site configuration → Environment variables** di Netlify.

---

## Installazione e avvio

### Prerequisiti

Assicurati di avere installato:
- **Node.js** versione 18 o superiore — [nodejs.org](https://nodejs.org)
- **npm** (incluso con Node.js)
- **Netlify CLI** (opzionale, necessario solo per usare le Netlify Functions in locale)

```bash
npm install -g netlify-cli
```

### 1. Clona il repository

```bash
git clone <url-del-repository>
cd OrtofruttaBrescia/ortofrutta
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

Crea il file `.env.local` nella cartella `ortofrutta/` come descritto nella sezione [Variabili d'ambiente](#variabili-dambiente).

### 4. Avvia l'applicazione

#### Modalità sviluppo — solo frontend (senza Netlify Functions)

```bash
npm run dev
```

L'app sarà disponibile su [http://localhost:5173](http://localhost:5173).

> In questa modalità le funzionalità che dipendono dalle Netlify Functions (creazione/eliminazione utenti, gestione prodotti da admin) non funzioneranno.

#### Modalità sviluppo — con Netlify Functions (consigliata)

```bash
netlify dev
```

L'app e le funzioni serverless saranno disponibili su [http://localhost:3000](http://localhost:3000).

### 5. Build di produzione

```bash
npm run build
```

I file ottimizzati vengono generati nella cartella `dist/`. Puoi testare la build localmente con:

```bash
npm run preview
```

---

## Compatibilità multi-piattaforma

L'app è progettata per funzionare correttamente su qualsiasi dispositivo e sistema operativo.

### Desktop
- **Windows**, **macOS**, **Linux** — supportati su tutti i browser moderni: Chrome, Firefox, Edge, Safari.

### Mobile
- **iPhone / iOS** — layout mobile-first con supporto per Safari; i link `tel:`, `mailto:` e `https://wa.me/` aprono le app native (Telefono, Mail, WhatsApp).
- **Android** — stesso comportamento su Chrome e browser di sistema.

### Progressive Web App (PWA)
L'app include un Service Worker (`sw.js`) e un manifest (`manifest.json`), quindi può essere **installata come app** direttamente dalla home screen su Android e iOS (Safari → "Aggiungi a Home").

### Design responsive
Ogni pagina usa classi Tailwind CSS responsive (`sm:`, `md:`, `lg:`) per adattare il layout a qualsiasi dimensione dello schermo: da smartphone 4" a monitor 4K.

---

## Come funziona

### Flusso di autenticazione

```
Utente → Login (email/password o username/password)
              ↓
        Supabase Auth emette JWT
              ↓
        AuthContext carica profilo e ruolo da tabella profili
              ↓
   ruolo = 'cliente'  →  /dashboard
   ruolo = 'titolare' →  /admin
```

Il login tramite username viene gestito da una Netlify Function (`login-by-username`) che usa la service role per trovare l'account associato all'username, poi restituisce le credenziali al client per completare il login standard con Supabase.

### Flusso di un ordine (cliente)

1. Il cliente accede a `/dashboard`
2. Seleziona la data di consegna sul calendario (le date passate sono bloccate)
3. Aggiunge prodotti uno alla volta: cerca il nome con autocomplete, imposta quantità e tipologia
4. Rivede il riepilogo dell'ordine
5. Conferma → l'ordine viene salvato su Supabase (`ordini` + `dettagli_ordine`)
6. Viene generato un PDF e caricato su Supabase Storage
7. L'ordine appare nello storico e può essere scaricato come PDF

### Flusso gestione ordini (titolare)

1. Il titolare accede a `/ordini`
2. Seleziona una data dal selettore settimanale (con contatore ordini per giorno)
3. Vede tutti gli ordini dei clienti per quella data
4. Può: segnare come completato, aprire il modale di modifica prodotti, eliminare
5. Ogni modifica rigenera il PDF dell'ordine automaticamente

### Protezione delle route

Il componente `ProtectedRoute` verifica:
- che l'utente sia autenticato (sessione Supabase valida)
- che il ruolo dell'utente corrisponda a quello richiesto dalla route

Se una delle due condizioni non è soddisfatta, l'utente viene reindirizzato a `/login`.

### Netlify Functions

Le operazioni privilegiate (che richiedono la service role di Supabase per bypassare l'RLS) vengono eseguite su funzioni serverless lato server:

| Funzione | Scopo |
|---|---|
| `create-user` | Crea un nuovo utente Supabase Auth + record profilo |
| `update-user` | Aggiorna email, password o nome di un utente |
| `delete-user` | Elimina utente da Supabase Auth (gli ordini vengono eliminati a cascata) |
| `list-clients` | Recupera lista clienti/ordini con service role (bypass RLS) |
| `create-product` | Aggiunge un prodotto al catalogo |
| `update-product` | Modifica nome o tipologie di un prodotto |
| `update-product-status` | Attiva/disattiva un prodotto |
| `delete-product` | Elimina un prodotto |
| `login-by-username` | Trova l'email associata a uno username per il login alternativo |

Ogni chiamata a queste funzioni include il JWT dell'utente autenticato nell'header `Authorization`, in modo che il server possa verificarne l'identità.

---

## Deploy

Il progetto è pensato per essere deployato su **Netlify** con le Netlify Functions incluse.

### Passaggi

1. Collega il repository a Netlify (Import project)
2. Imposta la cartella base: `ortofrutta`
3. Imposta il comando di build: `npm run build`
4. Imposta la cartella di output: `dist`
5. Aggiungi tutte le variabili d'ambiente nel pannello Netlify (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SERVICE_ROLE_KEY`)
6. Deploy → Netlify gestirà automaticamente le funzioni nella cartella `netlify/functions/`

---

## Contatti

- **Instagram**: [@ortofrutta.brescia](https://www.instagram.com/ortofrutta.brescia)
- **Email**: domenico72portesi@gmail.com
- **Telefono**: +39 388 800 5812
- **WhatsApp**: [Scrivi su WhatsApp](https://wa.me/393888005812)
