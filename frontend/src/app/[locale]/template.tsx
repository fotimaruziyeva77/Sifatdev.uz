import type { ReactNode } from "react";

/** Sahifalar orasida yumshoq o'tish (TZ 7.5). Template har navigatsiyada qayta o'rnatiladi. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
