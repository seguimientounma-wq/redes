import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seguimiento UNMa",
  description: "Sistema de Seguimiento Institucional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900 transition-colors dark:bg-gray-900 dark:text-gray-100 flex flex-col min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="flex-1">
            {children}
          </main>
          
          {/* Footer Global siempre visible al final */}
          <footer className="w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Dirección de Planificación, Seguimiento y Evaluación de Educación a Distancia
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                ¿Dudas, consultas o cambios? Contáctanos en:{' '}
                <a href="mailto:seguimiento.ead@unma.net.ar" className="text-blue-600 dark:text-blue-400 hover:underline">
                  seguimiento.ead@unma.net.ar
                </a>
              </p>
            </div>
          </footer>
          
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
