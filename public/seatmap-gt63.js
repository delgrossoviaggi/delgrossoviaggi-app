// public/seatmap-gt63.js
// Layout a 6 colonne: [Sx1, Sx2, AISLE, Dx1, Dx2, SIDE]
// SIDE usato per "PORTA" oppure per il 5° posto in coda.

export const GT63_LAYOUT = [
  // 1–24 (2x2)
  [1, 2, "AISLE", 3, 4, "BLANK"],
  [5, 6, "AISLE", 7, 8, "BLANK"],
  [9, 10, "AISLE", 11, 12, "BLANK"],
  [13, 14, "AISLE", 15, 16, "BLANK"],
  [17, 18, "AISLE", 19, 20, "BLANK"],
  [21, 22, "AISLE", 23, 24, "BLANK"],

  // 25–26 normali (lasciamo a sinistra, destra vuota)
  [25, 26, "AISLE", "BLANK", "BLANK", "BLANK"],

  // ✅ QUI LA MODIFICA: 27–28 a sinistra, a destra PORTA
  [27, 28, "AISLE", "BLANK", "BLANK", "DOOR"],

  // continua dopo la porta
  [29, 30, "AISLE", 31, 32, "BLANK"],
  [33, 34, "AISLE", 35, 36, "BLANK"],
  [37, 38, "AISLE", 39, 40, "BLANK"],
  [41, 42, "AISLE", 43, 44, "BLANK"],
  [45, 46, "AISLE", 47, 48, "BLANK"],
  [49, 50, "AISLE", 51, 52, "BLANK"],
  [53, 54, "AISLE", 55, 56, "BLANK"],
  [57, 58, "AISLE", "BLANK", "BLANK", "BLANK"],

  // ✅ ULTIMA FILA: 59–63 ALLINEATI (5 posti finali)
  [59, 60, "AISLE", 61, 62, 63],
];
