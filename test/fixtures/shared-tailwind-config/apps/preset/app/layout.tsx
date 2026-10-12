import "@acme/tailwind-config/themes.css";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-default text-content-default">{children}</body>
    </html>
  );
}
