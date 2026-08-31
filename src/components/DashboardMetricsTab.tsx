'use client';

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function DashboardMetricsTab({ tasks }: { tasks: any[] }) {
  // Calcular métricas
  const total = tasks.length;
  const cumplidas = tasks.filter(t => t.estado === 'Cumplida').length;
  const enProceso = tasks.filter(t => t.estado === 'En proceso').length;
  const canceladas = tasks.filter(t => t.estado === 'Cancelada').length;
  const vencidas = tasks.filter(t => t.estado === 'Vencida').length;
  const pendientes = tasks.filter(t => t.estado === 'Pendiente' || !t.estado).length;

  const dataPie = [
    { name: 'Cumplidas', value: cumplidas, color: '#22c55e' },
    { name: 'En Proceso', value: enProceso, color: '#eab308' },
    { name: 'Pendientes', value: pendientes, color: '#3b82f6' },
    { name: 'Vencidas', value: vencidas, color: '#ef4444' },
    { name: 'Canceladas', value: canceladas, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  // Agrupar por áreas
  const areasMap = new Map<string, { name: string, Cumplidas: number, Pendientes: number, EnProceso: number, Vencidas: number }>();
  
  tasks.forEach(t => {
    const area = t.area || 'Sin Área';
    if (!areasMap.has(area)) {
      areasMap.set(area, { name: area, Cumplidas: 0, Pendientes: 0, EnProceso: 0, Vencidas: 0 });
    }
    const data = areasMap.get(area)!;
    if (t.estado === 'Cumplida') data.Cumplidas += 1;
    else if (t.estado === 'En proceso') data.EnProceso += 1;
    else if (t.estado === 'Vencida') data.Vencidas += 1;
    else if (t.estado === 'Pendiente' || !t.estado) data.Pendientes += 1;
  });

  const dataBar = Array.from(areasMap.values());

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Tareas</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{total}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800 text-center">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">Cumplidas</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">{cumplidas}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800 text-center">
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">En Proceso</p>
          <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{enProceso}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Pendientes</p>
          <p className="text-3xl font-bold text-red-900 dark:text-red-100">{pendientes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm h-80">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Estado Global de Tareas</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataPie}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {dataPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm h-80">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Rendimiento por Área</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataBar}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="Cumplidas" stackId="a" fill="#22c55e" />
              <Bar dataKey="EnProceso" stackId="a" fill="#eab308" />
              <Bar dataKey="Pendientes" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Vencidas" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
