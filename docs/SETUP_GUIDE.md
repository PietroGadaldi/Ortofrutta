# 🥬 Ortofrutta Brescia - Setup Guide

Questa è l'app di gestione ordini per Ortofrutta Brescia, costruita con React + Vite + Supabase + Netlify.

## 📋 Prerequisiti

- Node.js 18+
- npm o yarn
- Account Supabase ([https://supabase.com](https://supabase.com))
- Account Netlify ([https://netlify.com](https://netlify.com))

## 🚀 Setup Locale (Development)

### 1. Variabili d'Ambiente

Copia `.env.local` e configura:

```bash
cp .env.local .env.local  # È già creato, solo aggiorna i valori
```

Poi modifica `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_NETLIFY_FUNCTIONS_URL=http://localhost:8888/.netlify/functions
```

Dove trovare questi dati:
- Accedi al tuo progetto Supabase
- Settings → API
- Copia `Project URL` e `anon public` key

### 2. Configurazione Database

Importa lo schema nel tuo progetto Supabase:

1. Vai su Supabase → SQL Editor
2. Copia il contenuto di `docs/schema.sql`
3. Esegui la query

Attenzione: Lo schema atuale ha RLS policies molto permissive. In production, aggiorna le policies per una sicurezza maggiore.

### 3. Installa Dipendenze

```bash
npm install
```

### 4. Avvia Dev Server

```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

### 5. Avvia Netlify Functions (Locale)

In un altro terminale:

```bash
npm install -g netlify-cli
netlify dev
```

Functions saranno disponibili su `http://localhost:8888/.netlify/functions`

### 6. Test Login

- Crea un account in Supabase (Auth → Users) con email/password
- Crea un profilo corrispondente in tabella `profili` con il tuo user ID
- Accedi all'app

```sql
INSERT INTO public.profili (id, nome, ruolo)
VALUES (
  'your-user-id-from-supabase-auth',
  'Test User',
  'titolare' -- o 'cliente'
);
```

---

## 📦 Build e Deploy su Netlify

### 1. Connetti Repository a Netlify

```bash
netlify init
```

Segui le istruzioni e scegli:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### 2. Configura Variabili d'Ambiente in Netlify

Dashboard Netlify → Site Settings → Environment:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_NETLIFY_FUNCTIONS_URL=https://your-site.netlify.app/.netlify/functions
```

### 3. Deploy

```bash
git push  # Auto-deploy se collegato a GitHub
# o manualmente:
netlify deploy --prod
```

---

## 🔐 Sicurezza: Production Setup

### Netlify Functions Authentication

Attualmente le functions usano JWT di Supabase. Per maggiore sicurezza:

1. Usa **Supabase Admin SDK** nelle functions con `service_role` key
2. Salva `service_role` key come variabile d'ambiente Netlify (NOT esposta al client)
3. Verifica JWT client-side nel header Authorization

Esempio:

```javascript
// netlify/functions/create-user.js
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Secret!
)

export async function handler(event) {
  // Verify JWT from client
  const token = event.headers.authorization?.replace('Bearer ', '')
  // ... verify token and check role
  
  // Use admin client for privileged operations
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  })
}
```

### RLS Policies (Database Security)

Lo schema attuale è molto permissivo. Per production, aggiorna le policies:

```sql
-- Profili: solo service_role legge/modifica
DROP POLICY "Profili visibili a tutti" ON public.profili;

CREATE POLICY "Profili - service_role only"
ON public.profili
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ordini: cliente vede suoi, titolare vede tutti
DROP POLICY "Ordini accessibili a chiunque" ON public.ordini;

CREATE POLICY "Ordini - cliente vede propri"
ON public.ordini
FOR SELECT
TO authenticated
USING (
  cliente_id = (SELECT auth.uid()) 
  OR 
  (SELECT ruolo FROM profili WHERE id = auth.uid()) = 'titolare'
);

-- ... similar for DELETE, UPDATE as needed
```

---

## 📁 Struttura Progetto

```
ortofrutta/
├── public/              # Assets statici
├── src/
│   ├── pages/          # Pagine principali
│   ├── components/     # Componenti riutilizzabili
│   ├── services/       # Logica API/DB
│   ├── hooks/          # React custom hooks
│   ├── context/        # Global state
│   ├── utils/          # Utilità e costanti
│   ├── App.jsx         # Router setup
│   └── main.jsx        # Entry point
├── netlify/functions/  # Netlify Functions backend
├── docs/               # Documentazione
├── netlify.toml        # Netlify config
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🔄 Workflow Development

### Locale

1. Modifica file React
2. Vite auto-refresh (`npm run dev`)
3. Test su `http://localhost:5173`

### Netlify Functions

1. Modifica file in `netlify/functions/`
2. Functions auto-reload con `netlify dev`
3. Test su `http://localhost:8888/.netlify/functions/function-name`

### Database

1. Modifica schema/data in Supabase Dashboard
2. Verifica da app (RLS policies potrebbero bloccare)
3. Usa service_role key in functions per admin operations

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Controlla `.env.local` ha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Riavvia server dev: `npm run dev`

### Functions non raggiungibili
- Assicurati `netlify dev` sia in esecuzione
- Controlla `VITE_NETLIFY_FUNCTIONS_URL` sia corretto
- Verifica JWT token è valido (login prima di chiamare functions)

### RLS Policies bloccano operazioni
- In dev, usa `supabase.auth.signInWithPassword()` prima di qualunque operazione
- Verifica che user ID e role siano corretti in tabella `profili`
- Considera disabilitare RLS temporaneamente in development (Settings → SQL Editor → Disable RLS)

### Build fallisce
- `npm run lint` per verificare errori ESLint
- `npm run build` per simulare build produzione
- Controlla che tutti gli import siano corretti

---

## 📚 Risorse

- [React Router Documentation](https://reactrouter.com/)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Tailwind CSS](https://tailwindcss.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Vite Documentation](https://vitejs.dev/)

---

## 💡 Prossimi Passi

1. **Email Notifications**: Implementa Sendgrid/Resend per notifiche ordini
2. **Audit Log**: Aggiungi tracking modifiche
3. **Advanced Filtering**: Paginazione e filtri avanzati in /ordini
4. **Dark Mode**: Aggiungi Tailwind dark mode
5. **PWA**: Rendi app installabile

---

Domande? Controlla `docs/schema.sql` o consulta la documentazione ufficiale dei tool usati.
