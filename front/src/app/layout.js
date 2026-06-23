import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";

export const metadata = {
  title: "Breezy",
  description: "Un réseau social comme ca !",
  icons: {
    icon: "/breezy-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 dark:bg-deep-space-blue text-slate-900 dark:text-papaya-whip transition-colors duration-300 min-h-screen">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
