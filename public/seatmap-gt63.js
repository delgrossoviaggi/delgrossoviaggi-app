// seatmap-gt63.js
// Layout: 6 colonne => [L1, L2, AISLE, R1, R2, SIDE]

export function buildGT63Layout() {
  const rows = [];

  const S = (n) => ({ type: "seat", n });
  const DOOR = { type: "door" };

  // 1..26 => 6 righe da 4 posti (24) + 1 riga con 25-26 (solo sinistra)
  // Prima facciamo 6 righe da 4 posti => 1..24
  let n = 1;
  for (let i = 0; i < 6; i++) {
    rows.push([S(n++), S(n++), null, S(n++), S(n++), null]);
  }

  // Riga 25-26 (solo sinistra)
  rows.push([S(25), S(26), null, null, null, null]);

  // Riga speciale: 27-28 a sinistra, PORTA in SIDE, a destra vuoto
  rows.push([S(27), S(28), null, null, null, DOOR]);

  // 29..58 => righe da 4 posti
  n = 29;
  while (n <= 58) {
    rows.push([S(n++), S(n++), null, S(n++), S(n++), null]);
  }

  // Ultimi 5 posti allineati: 59-60 | aisle | 61-62 | 63 in SIDE
  rows.push([S(59), S(60), null, S(61), S(62), S(63)]);

  return rows;
}
