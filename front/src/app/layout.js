import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

export const metadata = {
  title: "Breezy",
  description: "Un réseau social comme ca !",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      {/* on applique les classes Tailwind pour le mode clair et sombre */}
        <body className="bg-papaya-whip text-deep-space-blue dark:bg-deep-space-blue dark:text-papaya-whip transition-colors duration-300 min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}