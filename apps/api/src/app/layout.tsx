import type { ReactNode } from "react";

export const metadata = {
  title: "DawnLock API",
  description: "DawnLock backend smoke placeholder",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
