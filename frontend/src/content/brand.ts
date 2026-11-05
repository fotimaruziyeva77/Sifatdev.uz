/**
 * SIFAT logotipi (vektor, brend faylidan qayta chizilgan). viewBox 0 0 530 82.
 * Harflar chiziq (stroke) bilan, qizil vertikal chiziq — alohida to'rtburchak.
 * 3D sahna ham aynan shu yo'llardan nuqta oladi. Asl rasm: public/brand/.
 */
export const LOGO_VIEWBOX = { w: 530, h: 82 };
export const LOGO_STROKE = 13;
export const LOGO_BAR = { x: 0, y: 0, w: 13, h: 82 };

export const LOGO_PATHS = [
  // S
  "M119 6.5H40A17.25 17.25 0 0 0 40 41H103A17.25 17.25 0 0 1 103 75.5H25",
  // I
  "M146 0V82",
  // F
  "M185.5 0V82M179 6.5H259M179 41H247",
  // A (o'ziga xos: ichki qiya chiziqli Λ)
  "M277 80L344 5L418 80M283 75.5H318L333 58",
  // T
  "M439 6.5H530M484.5 0V82",
];

export const BRAND = {
  red: "#E3262F",
  redSoft: "#FF5A5F",
  white: "#F5F5F7",
};
