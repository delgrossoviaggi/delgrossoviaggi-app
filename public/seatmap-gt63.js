export function buildLayout() {
  const S = (n) => ({ type: "seat", n });
  const B = () => ({ type: "blank" });
  const A = () => ({ type: "aisle" });
  const D = () => ({ type: "door" });

  const rows = [];

  // Prime righe fino a 26 in 2+2
  let n = 1;
  for (let i = 0; i < 6; i++) {
    rows.push([S(n++), S(n++), A(), S(n++), S(n++), B()]); // 24 posti
  }
  // riga successiva: 25-26 + corridoio + (blank) + porta lato
  rows.push([S(25), S(26), A(), B(), B(), B()]);

  // Richiesta: i posti 27-28 passano a sinistra, a destra c'è la porta
  rows.push([S(27), S(28), A(), B(), B(), D()]);

  // Poi continua la numerazione da 29 in poi
  n = 29;
  // Metto righe standard finché arrivo a 58 (30 posti: 29..58 -> 30 posti)
  // 7 righe * 4 = 28 posti (29..56), poi una riga con 57..58 e due blank
  for (let i = 0; i < 7; i++) {
    rows.push([S(n++), S(n++), A(), S(n++), S(n++), B()]);
  }
  // Ora n dovrebbe essere 57
  rows.push([S(57), S(58), A(), B(), B(), B()]);

  // Ultimi 5 posti 59-63 ALLINEATI
  rows.push([S(59), S(60), S(61), S(62), S(63), B()]);

  return rows;
}
