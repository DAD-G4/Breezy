import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

export const metadata = {
  title: "Breezy",
  description: "Un réseau social comme ca !",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-gray-200 dark:bg-black text-slate-900 dark:text-papaya-whip transition-colors duration-300 min-h-screen">
        <ThemeProvider>
          
          {/* Conteneur smartphone */}
          <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-deep-space-blue shadow-2xl relative flex flex-col border-x border-gray-200 dark:border-white/10">
            {children}
          </div>

        </ThemeProvider>
      </body>
    </html>
  );
}