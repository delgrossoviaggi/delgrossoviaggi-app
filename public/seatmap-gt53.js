// seatmap-gt53.js
// Layout: 6 colonne => [L1, L2, AISLE, R1, R2, SIDE]
// Celle: null | { type:'seat', n } | { type:'door' } | { type:'driver' }

export function buildGT53Layout() {
  const rows = [];

  const S = (n) => ({ type: "seat", n });
  const DOOR = { type: "door" };

  // 1..24 => 6 righe da 4 posti
  let n = 1;
  for (let i = 0; i < 6; i++) {
    rows.push([S(n++), S(n++), null, S(n++), S(n++), null]);
  }

  // Riga porta: 25-26 a sinistra, 27-28 a destra, porta in SIDE
  rows.push([S(25), S(26), null, S(27), S(28), DOOR]);

  // 29..48 => 5 righe da 4 posti
  n = 29;
  for (let i = 0; i < 5; i++) {
    rows.push([S(n++), S(n++), null, S(n++), S(n++), null]);
  }

  // Ultimi 5 posti allineati: 49-50 | aisle | 51-52 | 53 in SIDE
  rows.push([S(49), S(50), null, S(51), S(52), S(53)]);

  return rows;
}
