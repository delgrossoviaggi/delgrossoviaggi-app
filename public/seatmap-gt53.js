export function buildLayout() {
  // Helper per creare riga standard (2+aisle+2+side)
  const S = (n) => ({ type: "seat", n });
  const B = () => ({ type: "blank" });
  const A = () => ({ type: "aisle" });
  const D = () => ({ type: "door" });

  const rows = [];

  // Righe 1..12 (48 posti) in schema 2+2
  // Ogni riga contiene 4 posti: L1,L2 | R1,R2
  // 12 righe * 4 = 48
  let n = 1;
  for (let i = 0; i < 12; i++) {
    rows.push([S(n++), S(n++), A(), S(n++), S(n++), B()]);
  }

  // Porta vicino a 25-26 (se vuoi visualizzarla più “realistica”, la mettiamo a metà)
  // Qui la rappresentiamo in una riga “di servizio” senza posti:
  rows.splice(6, 0, [B(), B(), A(), B(), B(), D()]); // dopo 6 righe

  // Ultimi 5 posti (49-53) ALLINEATI in unica riga
  // Richiesta: 49-50-51-52-53 allineati
  // Li metto: 49-50 a sinistra, 51 al corridoio “simulato” (centro), 52-53 a destra
  rows.push([S(49), S(50), S(51), S(52), S(53), B()]);

  return rows;
}
