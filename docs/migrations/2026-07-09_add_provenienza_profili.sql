-- Aggiunge la colonna "provenienza" (localizzazione del cliente, es. paese)
-- alla tabella profili. Tutti i valori restano NULL: verranno popolati
-- successivamente con una query di UPDATE dedicata.
-- Da eseguire nel SQL Editor di Supabase.

ALTER TABLE public.profili
  ADD COLUMN IF NOT EXISTS provenienza text DEFAULT NULL;

-- Esempio per popolare in seguito (NON eseguire ora):
-- UPDATE public.profili SET provenienza = 'Brescia' WHERE nome = 'nome_cliente';
