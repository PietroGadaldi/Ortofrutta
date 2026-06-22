import { createClient } from '@supabase/supabase-js'
import { encrypt } from '../netlify/functions/crypto-utils.js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SERVICE_ROLE_KEY
)

const CLIENTI = [
  { nome: 'CHALET CARLO MAGNO', password: 'Chalet1.' },
  { nome: 'CONVENTO RISTORANTE', password: 'Convento1.' },
  { nome: 'OSTERIA AL TORCOL', password: 'Torcol1.' },
  { nome: 'RISTORANTE ALLA GROTTA', password: 'Grotta1.' },
  { nome: 'LOCANDA DEI GUASCONI', password: 'Guasconi1.' },
  { nome: 'PICCOLINO CUCINA E PIZZA', password: 'Piccolino1.' },
  { nome: 'ATENA MULTI FORME', password: 'Atena1.' },
  { nome: 'ASILO NIDO AUGUSTA', password: 'Augusta1.' },
  { nome: 'HOTEL CARLONE', password: 'Carlone1.' },
  { nome: 'NUOVO NANDO', password: 'Nando1.' },
  { nome: 'BAIA BIANCA', password: 'Baia1.' },
  { nome: 'BALLARDINI GOURMET MARKET ENOTECA WINESHOP', password: 'Ballardini1.' },
  { nome: 'BAR GELATERIA PINGUINO GIALLO', password: 'Pinguino1.' },
  { nome: 'SOUTH GARDA KARTING', password: 'Karting1.' },
  { nome: "BISTRO' TRA LE MURA", password: 'Mura1.' },
  { nome: "CAFFE' BELL'ARRIVO", password: 'Bellarrivo1.' },
  { nome: "CAFFE' ITALIA", password: 'Italia1.' },
  { nome: 'TENUTA BORGO LA CACCIA', password: 'CacciaT1.' },
  { nome: 'SCUDERIA BORGO LA CACCIA', password: 'CacciaS1.' },
  { nome: 'PIZZERIA ROSTICCERIA BORGO CLIO', password: 'Clio1.' },
  { nome: 'BORGO MACHETTO', password: 'Machetto1.' },
  { nome: 'COCO BEACH CLU', password: 'Coco1.' },
  { nome: 'RISTORANTE PIZZERIA PAPILLON', password: 'Papillon1.' },
  { nome: 'RISTORANTE CASCINA CAPUZZA', password: 'Capuzza1.' },
  { nome: 'CASCINA DELLA TAVERNA', password: 'Taverna1.' },
  { nome: 'CHIOSCO PORTO TORCHIO', password: 'Torchio1.' },
  { nome: 'HOTEL LIDO INTERNATIONAL', password: 'LidoI1.' },
  { nome: 'BAR RIO 58', password: 'Rio1.' },
  { nome: 'CLUB DEL SOLE DESENZANO BOUTIQUE RESORT', password: 'Sole1.' },
  { nome: 'CHIOSCO LIDO BEACH', password: 'LidoB1.' },
  { nome: 'EL RIEL BEACHBAR', password: 'Riel1.' },
  { nome: 'OSTERIA DALIE E FAGIOLI', password: 'Dalie1.' },
  { nome: 'IL FUNGO', password: 'Fungo1.' },
  { nome: 'IN CANTINA DA DEA', password: 'Cantina1.' },
  { nome: 'PASTICCERIA ANDREOLETTI', password: 'Andreoletti1.' },
  { nome: 'OSTERIA CAPO BORGO', password: 'Capo1.' },
  { nome: 'DOLOMEET BOUTIQUE HOTEL', password: 'Dolomeet1.' },
  { nome: 'EDELWEISS ALPINE NATURE HOTEL', password: 'Edelweiss1.' },
  { nome: 'TAVERNETTA MARIA CALLAS', password: 'Tavernetta1.' },
  { nome: 'AGRITURISMO ALMAVITE', password: 'Almavite1.' },
  { nome: 'CHIOSCO LA PAGODA DEL PENNA', password: 'Pagoda1.' },
  { nome: 'OSTERIA DAL PENNA', password: 'Penna1.' },
  { nome: 'RISTORANTE FIOR DI LOTO', password: 'Fior1.' },
  { nome: 'HOTEL FLAMINIA', password: 'Flaminia1.' },
  { nome: 'HOTEL FLAMINIA COLAZIONI', password: 'FlaminiaC1.' },
  { nome: 'RISTORANTE MANO', password: 'Mano1.' },
  { nome: 'RISTORANTE VISTA', password: 'Vista1.' },
  { nome: 'MINI MARKET FLORIOLI', password: 'Florioli1.' },
  { nome: 'FRANTOIO MANESTRINI', password: 'Manestrini1.' },
  { nome: 'RISTORANTE LE TERRAZZE', password: 'Terrazze1.' },
  { nome: 'HOTEL MILANO TOSCOLANO MADERNO', password: 'Milano1.' },
  { nome: 'HOTEL PORTA DEL SOLE COLAZIONI', password: 'PortaC1.' },
  { nome: 'HOTEL DONNA SILVIA', password: 'Donna1.' },
  { nome: 'HOTEL RIVA DEL SOLE', password: 'Riva1.' },
  { nome: 'OSTERIA DELLA PIEVE', password: 'Pieve1.' },
  { nome: 'HOTEL PORTA DEL SOLE RISTORANTE', password: 'PortaR1.' },
  { nome: 'HOTEL RIVA DEL SOLE COLAZIONI', password: 'RivaC1.' },
  { nome: 'DEL GARDA VILLAGE AND CAMPING (GARDACAMP)', password: 'Gardacamp1.' },
  { nome: 'GELGARDA FOOD PASSION', password: 'Gelgarda1.' },
  { nome: 'GARDA HOTEL', password: 'Garda1.' },
  { nome: 'TROPICANA BEACH BAR', password: 'Tropicana1.' },
  { nome: 'LAKE GARDA RESORT', password: 'Lake1.' },
  { nome: 'DIEFFE EVENTI', password: 'Dieffe1.' },
  { nome: 'HOTEL BELVEDERE', password: 'Belvedere1.' },
  { nome: 'HOTEL CRISTAL PALACE', password: 'Cristal1.' },
  { nome: 'SPINALE HOTEL', password: 'Spinale1.' },
  { nome: 'BOUTIQUE HOTEL VILLA SOSTAGA', password: 'Sostaga1.' },
  { nome: 'JHON VENICE BAR', password: 'Jhon1.' },
  { nome: 'COPELIA', password: 'Copelia1.' },
  { nome: 'LA PALADERETA', password: 'Paladereta1.' },
  { nome: 'SALAMENSA', password: 'Salamensa1.' },
  { nome: 'LA MACELLERIA DEL BORGO', password: 'Macelleria1.' },
  { nome: "ROCO'S LAB - PIZZA FOOD", password: 'Rocos1.' },
  { nome: 'SPRITZ & BURGER', password: 'Spritz1.' },
  { nome: 'LOCANDA AGLI ANGELI', password: 'Angeli1.' },
  { nome: 'PIETRA CAVALLA AGRITURISMO', password: 'Pietra1.' },
  { nome: 'ORO BRESCIA', password: 'Oro1.' },
  { nome: "L'OSTERIA H2O", password: 'H2o1.' },
  { nome: 'LUGANA BEACH RISTORANTE', password: 'Lugana1.' },
  { nome: 'FENICE BISTROT', password: 'FeniceB1.' },
  { nome: 'FENICE PASTICCERIA', password: 'FeniceP1.' },
  { nome: 'FENICE RISTORANTE', password: 'FeniceR1.' },
  { nome: 'VECCHIA MARINA RISTORANTE E PIZZERIA', password: 'Marina1.' },
  { nome: "ANDO'S BURGER", password: 'Andos1.' },
  { nome: 'COLOMBAIA VILLAGE', password: 'Colombaia1.' },
  { nome: 'VILLENPARK SANGHEN', password: 'Villenpark1.' },
  { nome: 'MOJO', password: 'Mojo1.' },
  { nome: 'MOKAI BEACH', password: 'Mokai1.' },
  { nome: "GISTRO' CUCINA & PIZZA", password: 'Gistro1.' },
  { nome: 'HOTEL ESTEE', password: 'Estee1.' },
  { nome: 'HOTEL DU PARCK', password: 'Parck1.' },
  { nome: 'ALLA SCALA SIRMIONE', password: 'Scala1.' },
  { nome: 'CAMPING TIGLIO SIRMIONE', password: 'Tiglio1.' },
  { nome: 'HOTEL CRISTAL PALACE', password: 'Cristal1.' },
  { nome: 'OLYMPIC ROYAL HOTEL', password: 'OlympicRoy1.' },
  { nome: 'OLYMPIC REGINA HOTEL', password: 'OlympicReg1.' },
  { nome: 'HOTEL PERLA', password: 'Perla1.' },
  { nome: 'OSTERIA AI COLLI', password: 'Colli1.' },
  { nome: 'ALIMENTARI PIVA MARIA', password: 'Piva1.' },
  { nome: 'CAMPING PIANTELLE RISTORANTE', password: 'PiantR1.' },
  { nome: 'CAMPING PIANTELLE MARKET', password: 'PiantM1.' },
  { nome: 'AL VELIERO', password: 'Veliero1.' },
  { nome: "CAFFE' DEL PORTO", password: 'Porto1.' },
  { nome: "PUNTA GRO' BISTROT CAFE'", password: 'Punta1.' },
  { nome: 'CAPRICE UNO', password: 'Caprice1.' },
  { nome: "RISTORANTE OLE'", password: 'Ole1.' },
  { nome: 'RISTORANTE IL GIRASOLE', password: 'Girasole1.' },
  { nome: "CONCA D'ORO CHIOSCO", password: 'Conca1.' },
  { nome: 'SBAFF IL GALLETTO CHURRASCO', password: 'Sbaff1.' },
  { nome: 'RISTORANTE HOTEL KETTY', password: 'Ketty1.' },
  { nome: 'SELVA BISTROT', password: 'Selva1.' },
  { nome: 'BAR MARACUJA', password: 'Maracuja1.' },
  { nome: 'MARKET IDEA', password: 'Idea1.' },
  { nome: 'RISTORANTE BASILICO', password: 'Basilico1.' },
  { nome: 'AGRITURISMO BORGO DI SOPRA', password: 'Sopra1.' },
  { nome: 'AGRITURISMO LA CIVETTA', password: 'Civetta1.' },
  { nome: 'VILLA AVANZI', password: 'Avanzi1.' },
  { nome: 'HOTEL SPENDID', password: 'Spendid1.' },
  { nome: "PIAZZA D'ARMI", password: 'Piazza1.' },
  { nome: "BOCCON D'ORO EVENTI", password: 'Boccon1.' },
  { nome: 'MOD 05 BIKE HOTEL', password: 'Mod1.' },
  { nome: 'LA CAMBUSA BISTROT', password: 'Cambusa1.' },
  { nome: 'RISTORANTE ACQUADOLCE', password: 'Acquadolce1.' },
  { nome: 'HOTEL OLIVETO', password: 'Oliveto1.' },
  { nome: 'ASILO PAITONE', password: 'Paitone1.' },
]

async function seedCliente({ nome, password }) {
  const email = `noemail_${Date.now()}_${Math.random().toString(36).slice(2, 9)}@noreply.internal`

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      console.log(`SKIP   ${nome}`)
      return 'skip'
    }
    console.error(`ERRORE ${nome}: ${authError.message}`)
    return 'error'
  }

  const { error: profileError } = await supabaseAdmin
    .from('profili')
    .insert({ id: authData.user.id, nome, ruolo: 'cliente', password_plain: encrypt(password) })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    console.error(`ERRORE ${nome} (profilo): ${profileError.message}`)
    return 'error'
  }

  console.log(`OK     ${nome}`)
  return 'ok'
}

console.log(`Avvio inserimento ${CLIENTI.length} clienti...\n`)
let ok = 0, skip = 0, errors = 0

for (const cliente of CLIENTI) {
  const result = await seedCliente(cliente)
  if (result === 'ok') ok++
  else if (result === 'skip') skip++
  else errors++
}

console.log(`\nCompletato: ${ok} creati, ${skip} saltati, ${errors} errori.`)
