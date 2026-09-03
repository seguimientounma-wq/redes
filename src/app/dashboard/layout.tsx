import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/actions/auth';
import { LogOut } from 'lucide-react';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col transition-colors dark:bg-gray-950">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 transition-colors dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <Image src="/logo.png" alt="UNMa Logo" width={70} height={70} className="object-contain dark:brightness-0 dark:invert transition-all" />
                <span className="text-xl font-bold text-gray-900 hidden sm:block dark:text-gray-100">Seguimiento UNMa</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block text-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{user.nombre}</p>
                <p className="text-gray-500 dark:text-gray-400">{user.area} - {user.cargo}</p>
              </div>
              
              <ThemeToggle />

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors dark:text-gray-400 dark:hover:bg-red-900/20"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
