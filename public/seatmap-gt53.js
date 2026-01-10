// public/seatmap-gt53.js
// Layout a 6 colonne: [Sx1, Sx2, AISLE, Dx1, Dx2, SIDE]
// SIDE lo usiamo per "PORTA" oppure per il 5° posto in coda.

export const GT53_LAYOUT = [
  // 1–24 (2x2 classico)
  [1, 2, "AISLE", 3, 4, "BLANK"],
  [5, 6, "AISLE", 7, 8, "BLANK"],
  [9, 10, "AISLE", 11, 12, "BLANK"],
  [13, 14, "AISLE", 15, 16, "BLANK"],
  [17, 18, "AISLE", 19, 20, "BLANK"],
  [21, 22, "AISLE", 23, 24, "BLANK"],

  // Fila porta vicino a 25-26 (come mi hai indicato)
  [25, 26, "AISLE", 27, 28, "DOOR"],

  // 29–48 (continua 2x2)
  [29, 30, "AISLE", 31, 32, "BLANK"],
  [33, 34, "AISLE", 35, 36, "BLANK"],
  [37, 38, "AISLE", 39, 40, "BLANK"],
  [41, 42, "AISLE", 43, 44, "BLANK"],
  [45, 46, "AISLE", 47, 48, "BLANK"],

  // ✅ ULTIMA FILA: 49–53 ALLINEATI (5 posti di chiusura bus)
  [49, 50, "AISLE", 51, 52, 53],
];
