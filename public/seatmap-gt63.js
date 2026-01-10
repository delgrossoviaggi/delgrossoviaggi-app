/**
 * GT 63
 * Regola richiesta:
 * - bus 2+2 con corridoio
 * - porta affianco alla zona 28-29 (nel nostro layout: riga che inizia con 28)
 * - dietro: ultimi 1+1+1+1+1 posti (qui ne abbiamo 7 posti finali: 57..63)
 */

export function getLayout() {
  const rows = [];

  // Driver
  rows.push(["DRIVER", null, "AISLE", null, null, null]);

  // 14 righe da 4 posti = 56 posti (1..56)
  let n = 1;
  for (let r = 0; r < 14; r++) {
    const a = n++;
    const b = n++;
    const c = n++;
    const d = n++;

    // riga porta: quando a=28 (quindi b=29)
    if (a === 28) {
      rows.push([a, b, "AISLE", c, d, "DOOR"]);
    } else {
      rows.push([a, b, "AISLE", c, d, null]);
    }
  }

  // Ultimi posti (singoli) 57..63 (7 posti)
  rows.push([57, null, "AISLE", 58, null, 59]);
  rows.push([60, null, "AISLE", 61, null, 62]);
  rows.push([63, null, "AISLE", null, null, null]);

  return rows;
}
