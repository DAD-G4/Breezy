import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { NotificationsProvider } from "../context/NotificationsContext";

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
      <body className="bg-slate-50 dark:bg-night text-slate-900 dark:text-white transition-colors duration-300 min-h-screen">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationsProvider>
                {children}
              </NotificationsProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
