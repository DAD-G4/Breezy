import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext"; 

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
      <body className="bg-white dark:bg-deep-space-blue text-deep-space-blue dark:text-papaya-whip transition-colors duration-300 min-h-screen">
        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}