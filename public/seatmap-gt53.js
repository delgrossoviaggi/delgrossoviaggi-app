/**
 * GT 53
 * Regola richiesta:
 * - bus 2+2 con corridoio
 * - porta affianco alla zona 25-26 (nel nostro layout: riga con 25-28)
 * - dietro: ultimi 1+1+1+1+1 posti (li mettiamo in 2 righe: 3 + 2 = 5)
 */

export function getLayout() {
  const rows = [];

  // Riga "frontale" (driver)
  rows.push(["DRIVER", null, "AISLE", null, null, null]);

  // 12 righe da 4 posti = 48 posti (1..48)
  let n = 1;
  for (let r = 0; r < 12; r++) {
    const a = n++;
    const b = n++;
    const c = n++;
    const d = n++;

    // riga speciale porta: quella che contiene 25..28 (cioè quando a=25)
    if (a === 25) {
      rows.push([a, b, "AISLE", c, d, "DOOR"]);
    } else {
      rows.push([a, b, "AISLE", c, d, null]);
    }
  }

  // Ultimi 5 posti singoli: 49..53
  rows.push([49, null, "AISLE", 50, null, 51]);
  rows.push([52, null, "AISLE", 53, null, null]);

  return rows;
}
