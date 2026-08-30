const SECTIONS = [
  {
    title: '1. Titolare del trattamento',
    body: (
      <>
        <p>
          Il titolare del trattamento dei dati è <strong>Ortofrutta Brescia</strong> — P.IVA e
          C.F. 03977830987, con magazzino in Via Ticino, 16 int. 7, 25081 Bedizzole (BS).
        </p>
        <p>
          Contatti: Tel. 030 4192674 — Cell. 388 8005812 — Email:{' '}
          <a href="mailto:domenico72portesi@gmail.com" className="link-privacy">
            domenico72portesi@gmail.com
          </a>{' '}
          — PEC:{' '}
          <a href="mailto:ortofruttabrescia@legalmail.it" className="link-privacy">
            ortofruttabrescia@legalmail.it
          </a>
        </p>
      </>
    ),
  },
  {
    title: '2. Quali dati trattiamo',
    body: (
      <>
        <p>Questa applicazione è riservata ai clienti dell&apos;azienda. Trattiamo:</p>
        <ul>
          <li>
            <strong>Dati identificativi e di contatto</strong>: nome o ragione sociale, email,
            località di provenienza, forniti al momento della creazione dell&apos;account da parte
            del titolare.
          </li>
          <li>
            <strong>Credenziali di accesso</strong>: la password è conservata in forma cifrata.
          </li>
          <li>
            <strong>Dati relativi agli ordini</strong>: prodotti richiesti, quantità, date di
            consegna e documenti PDF generati dagli ordini.
          </li>
        </ul>
        <p>Non vengono raccolti dati di navigazione a fini statistici o pubblicitari.</p>
      </>
    ),
  },
  {
    title: '3. Finalità e base giuridica',
    body: (
      <>
        <p>I dati sono trattati esclusivamente per:</p>
        <ul>
          <li>gestire l&apos;accesso all&apos;area riservata;</li>
          <li>ricevere, elaborare e archiviare gli ordini di frutta e verdura;</li>
          <li>adempiere agli obblighi contabili e fiscali connessi.</li>
        </ul>
        <p>
          La base giuridica è l&apos;esecuzione del rapporto contrattuale con il cliente (art. 6,
          par. 1, lett. b GDPR) e l&apos;adempimento di obblighi di legge (lett. c).
        </p>
      </>
    ),
  },
  {
    title: '4. Dove sono conservati i dati',
    body: (
      <>
        <p>
          I dati sono conservati sui sistemi cloud dei fornitori tecnici utilizzati
          dall&apos;applicazione, che agiscono come responsabili del trattamento:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — database e archiviazione dei documenti PDF;
          </li>
          <li>
            <strong>Netlify</strong> — hosting dell&apos;applicazione web.
          </li>
        </ul>
        <p>
          I dati sono conservati per la durata del rapporto con il cliente e, successivamente, per
          il tempo richiesto dagli obblighi di legge.
        </p>
      </>
    ),
  },
  {
    title: '5. Diritti dell’interessato',
    body: (
      <>
        <p>
          In qualsiasi momento è possibile esercitare i diritti previsti dagli artt. 15-22 del
          GDPR: accesso ai propri dati, rettifica, cancellazione, limitazione del trattamento,
          portabilità e opposizione. Per esercitarli è sufficiente contattare il titolare ai
          recapiti indicati al punto 1.
        </p>
        <p>
          È inoltre possibile proporre reclamo al Garante per la protezione dei dati personali
          (www.garanteprivacy.it).
        </p>
      </>
    ),
  },
  {
    title: '6. Cookie policy',
    body: (
      <>
        <p>
          Questa applicazione <strong>non utilizza cookie di profilazione, pubblicitari o di
          terze parti</strong>. Vengono utilizzate solo tecnologie strettamente necessarie al
          funzionamento:
        </p>
        <ul>
          <li>
            <strong>Sessione di accesso</strong>: il token di autenticazione viene salvato nel
            browser (localStorage) per mantenere l&apos;utente collegato. Viene rimosso al logout.
          </li>
          <li>
            <strong>Preferenza sull&apos;avviso cookie</strong>: memorizza la chiusura del banner
            informativo per non riproporlo a ogni visita.
          </li>
        </ul>
        <p>
          Trattandosi esclusivamente di tecnologie tecniche, non è richiesto alcun consenso
          preventivo. È possibile eliminarle in qualsiasi momento cancellando i dati di
          navigazione del browser.
        </p>
      </>
    ),
  },
]

export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="card card-pad">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
          Informativa Privacy e Cookie
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Informativa resa ai sensi degli artt. 13-14 del Regolamento (UE) 2016/679 (GDPR).
          Ultimo aggiornamento: agosto 2026.
        </p>

        <div className="space-y-8">
          {SECTIONS.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
              <div className="text-sm text-slate-600 leading-relaxed max-w-prose space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_.link-privacy]:text-verde-orto-700 [&_.link-privacy]:underline [&_.link-privacy]:underline-offset-2">
                {body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Privacy
