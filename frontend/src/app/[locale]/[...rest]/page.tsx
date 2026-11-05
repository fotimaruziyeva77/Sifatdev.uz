import { notFound } from "next/navigation";

/** Til ichidagi noma'lum manzillar → lokalizatsiya qilingan 404. */
export default function CatchAll() {
  notFound();
}
