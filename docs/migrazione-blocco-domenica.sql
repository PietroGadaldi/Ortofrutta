-- Migrazione: blocco ordini con consegna di domenica per i clienti
-- (stagione finita, non si lavora la domenica — fino a data da definirsi)
--
-- Da eseguire una volta nel SQL Editor di Supabase.
-- Il titolare NON è toccato: continua a passare dalla policy
-- "Titolare vede tutti gli ordini" e può creare ordini per qualsiasi giorno.
--
-- Per riattivare gli ordini domenicali in futuro, rieseguire questo script
-- togliendo la riga "AND EXTRACT(DOW FROM data_ordine) <> 0".

DROP POLICY IF EXISTS "Ordini del cliente" ON public.ordini;

CREATE POLICY "Ordini del cliente"
ON public.ordini
FOR ALL
TO authenticated
USING (cliente_id = auth.uid())
WITH CHECK (
  cliente_id = auth.uid()
  -- Domenica = 0: i clienti non possono inserire/spostare ordini di domenica
  AND EXTRACT(DOW FROM data_ordine) <> 0
);
