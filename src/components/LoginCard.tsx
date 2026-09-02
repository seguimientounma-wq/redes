'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginCard() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await loginAction(formData);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success) {
        toast.success('Acceso correcto. Redirigiendo...');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative z-0">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 relative z-10 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center">
          {/* Logo UNMa */}
          <div className="mb-6 relative w-48 h-48 md:w-56 md:h-56">
            <Image 
              src="/logo.png" 
              alt="Logo UNMa" 
              fill 
              className="object-contain" 
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">Seguimiento Institucional</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Acceso para Personal No Docente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-8 relative z-50">
          <div className="relative z-50">
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700 dark:text-gray-300">DNI / Legajo</label>
            <input
              type="text"
              id="dni"
              name="dni"
              required
              className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors relative z-50 dark:text-white"
              placeholder="Ingresa tu DNI sin puntos"
            />
          </div>

          <div className="relative z-50">
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN de Seguridad</label>
            <input
              type="password"
              id="pin"
              name="pin"
              required
              className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors relative z-50 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition-colors cursor-pointer relative z-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
