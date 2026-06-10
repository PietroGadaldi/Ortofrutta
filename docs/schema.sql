-- =========================================================================
-- 0. PULIZIA DEL DATABASE (FACOLTATIVA MA CONSIGLIATA)
-- Elima le vecchie tabelle se già presenti per evitare conflitti di sovrascrittura
-- =========================================================================
DROP TABLE IF EXISTS public.dettagli_ordine, public.ordini, public.prodotti, public.profili CASCADE;


-- =========================================================================
-- 1. CREAZIONE TABELLA: profili
-- Estende la tabella nativa degli utenti di Supabase (auth.users)
-- =========================================================================
CREATE TABLE public.profili (
    id uuid REFERENCES auth.users ON UPDATE CASCADE ON DELETE CASCADE NOT NULL PRIMARY KEY,
    nome text NOT NULL,
    ruolo text NOT NULL DEFAULT 'cliente'::text,
    CONSTRAINT check_ruolo CHECK (ruolo = ANY (ARRAY['cliente'::text, 'titolare'::text]))
);


-- =========================================================================
-- 2. CREAZIONE TABELLA: prodotti
-- Contiene il catalogo e le stringhe con le opzioni di vendita possibili
-- =========================================================================
CREATE TABLE public.prodotti (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL UNIQUE,
    tipologie_possibili text NOT NULL,
    attivo boolean NOT NULL DEFAULT true
);


-- =========================================================================
-- 3. CREAZIONE TABELLA: ordini
-- Registra la testa dell'ordine e lo stato di completamento (vero/falso)
-- =========================================================================
CREATE TABLE public.ordini (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid REFERENCES public.profili(id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
    data_creazione timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT NULL,
    data_ordine date NOT NULL DEFAULT CURRENT_DATE,
    completato boolean NOT NULL DEFAULT false
);


-- =========================================================================
-- 4. CREAZIONE TABELLA: dettagli_ordine
-- Collega i singoli prodotti acquistati all'ordine generale
-- =========================================================================
CREATE TABLE public.dettagli_ordine (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ordine_id uuid REFERENCES public.ordini(id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
    prodotto_id uuid REFERENCES public.prodotti(id) ON UPDATE CASCADE ON DELETE CASCADE,
    quantita numeric NOT NULL,
    tipologia text NOT NULL,
    nome_custom text 
);


-- =========================================================================
-- 5. ATTIVAZIONE DELLA SICUREZZA (ROW LEVEL SECURITY - RLS)
-- Blocca l'accesso di default a tutte le tabelle per motivi di sicurezza
-- =========================================================================
ALTER TABLE public.profili ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prodotti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dettagli_ordine ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- 6. DEFINIZIONE DELLE POLITICHE DI ACCESSO (POLICIES)
-- Specifica cosa può fare l'applicazione tramite la chiave pubblica (anon)
-- =========================================================================

-- Tabella Profili: Utenti autenticati possono leggere il proprio profilo
CREATE POLICY "Utenti leggono il proprio profilo"
ON public.profili
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Tabella Prodotti: Visibile a chiunque in sola lettura
CREATE POLICY "Prodotti visibili a tutti" 
ON public.prodotti 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Tabella Ordini: Interamente gestibile (Lettura, Inserimento, Modifica, Rimozione)
CREATE POLICY "Ordini accessibili a chiunque" 
ON public.ordini 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Tabella Dettagli Ordine: Interamente gestibile (Lettura, Inserimento, Modifica, Rimozione)
CREATE POLICY "Dettagli ordine accessibili a chiunque" 
ON public.dettagli_ordine 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);