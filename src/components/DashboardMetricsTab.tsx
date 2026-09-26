'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, LabelList } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter } from 'lucide-react';

export default function DashboardMetricsTab({ 
  tasks, 
  filteredTasks,
  activeFilters,
  toggleFilter,
  clearFilters,
  onUpdateClick 
}: { 
  tasks: any[], 
  filteredTasks: any[],
  activeFilters: Record<string, string>,
  toggleFilter: (k: string, v: string) => void,
  clearFilters: () => void,
  onUpdateClick?: (id: string) => void 
}) {
  const [selectedDayTasks, setSelectedDayTasks] = useState<any[]>([]);
  const hasFilters = Object.keys(activeFilters).length > 0;

  // 1. Métricas Generales
  const total = filteredTasks.length;
  const cumplidas = filteredTasks.filter(t => t.estado === 'Cumplida').length;
  const enProceso = filteredTasks.filter(t => t.estado === 'En proceso').length;
  const canceladas = filteredTasks.filter(t => t.estado === 'Cancelada').length;
  const vencidas = filteredTasks.filter(t => t.estado === 'Vencida').length;
  const pendientes = filteredTasks.filter(t => t.estado === 'Pendiente' || !t.estado).length;

  const dataPie = [
    { name: 'Cumplidas', rawName: 'Cumplida', value: cumplidas, color: '#22c55e' },
    { name: 'En Proceso', rawName: 'En proceso', value: enProceso, color: '#eab308' },
    { name: 'Pendientes', rawName: 'Pendiente', value: pendientes, color: '#3b82f6' },
    { name: 'Vencidas', rawName: 'Vencida', value: vencidas, color: '#ef4444' },
    { name: 'Canceladas', rawName: 'Cancelada', value: canceladas, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  // 2. Agrupar por áreas
  const areasMap = new Map<string, { name: string, Cumplidas: number, Pendientes: number, EnProceso: number, Vencidas: number }>();
  filteredTasks.forEach(t => {
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

  // 3. Prioridades
  const prioridadMap: Record<string, number> = { Alta: 0, Media: 0, Baja: 0 };
  filteredTasks.forEach(t => {
    const p = t.prioridad || 'Media';
    if (prioridadMap[p] !== undefined) prioridadMap[p]++;
  });
  const dataPrioridad = [
    { name: 'Alta', value: prioridadMap.Alta, color: '#ef4444' },
    { name: 'Media', value: prioridadMap.Media, color: '#eab308' },
    { name: 'Baja', value: prioridadMap.Baja, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  // 4. Evolución de carga (por DÍA de inicio)
  const timelineMap = new Map<string, { Creadas: number, tareas: any[], Cumplidas: number, EnProceso: number, Pendientes: number, Vencidas: number, Canceladas: number }>();
  filteredTasks.forEach(t => {
    if (t.fechaInicio) {
      const day = t.fechaInicio;
      if (!timelineMap.has(day)) timelineMap.set(day, { Creadas: 0, tareas: [], Cumplidas: 0, EnProceso: 0, Pendientes: 0, Vencidas: 0, Canceladas: 0 });
      const data = timelineMap.get(day)!;
      data.Creadas += 1;
      data.tareas.push(t);
      if (t.estado === 'Cumplida') data.Cumplidas += 1;
      else if (t.estado === 'En proceso') data.EnProceso += 1;
      else if (t.estado === 'Vencida') data.Vencidas += 1;
      else if (t.estado === 'Cancelada') data.Canceladas += 1;
      else data.Pendientes += 1;
    }
  });
  const dataTimeline = Array.from(timelineMap.entries())
    .map(([name, data]) => ({ 
      name, 
      Creadas: data.Creadas, 
      tareas: data.tareas,
      Cumplidas: data.Cumplidas, 
      'En Proceso': data.EnProceso, 
      Pendientes: data.Pendientes, 
      Vencidas: data.Vencidas, 
      Canceladas: data.Canceladas 
    }))
    .sort((a, b) => {
       const pa = a.name.split(/[\/\-]/);
       const pb = b.name.split(/[\/\-]/);
       if (pa.length === 3 && pb.length === 3) {
           const da = new Date(Number(pa[2]), Number(pa[1])-1, Number(pa[0]));
           const db = new Date(Number(pb[2]), Number(pb[1])-1, Number(pb[0]));
           return da.getTime() - db.getTime();
       }
       return 0;
    });

  // 5. Top Personal
  const docenteMap = new Map<string, number>();
  filteredTasks.forEach(t => {
    if (t.docenteVinculado) {
      docenteMap.set(t.docenteVinculado, (docenteMap.get(t.docenteVinculado) || 0) + 1);
    }
  });
  const topPersonal = Array.from(docenteMap.entries())
    .map(([name, Tareas]) => ({ name, Tareas }))
    .sort((a, b) => b.Tareas - a.Tareas)
    .slice(0, 5);

  // 6. Nube de Palabras Semántica
  let wordFrequencies: { text: string, value: number, porcentaje: number }[] = [];
  try {
    // Dynamically require to avoid breaking SSR if stopword has issues
    const stopword = require('stopword');
    const allDescriptions = filteredTasks.map(t => t.descripcion || '').join(' ');
    const totalValidTasks = filteredTasks.filter(t => t.descripcion && t.descripcion.trim().length > 0).length || 1;
    const words = allDescriptions.toLowerCase().match(/\b[a-záéíóúüñ]+\b/g) || [];
    const filteredWords = stopword.removeStopwords(words, stopword.spa);

    const freqs: Record<string, number> = {};
    filteredWords.forEach((w: string) => {
      // Filtrar palabras muy cortas o números
      if (w.length > 3 && !/^\d+$/.test(w)) {
        freqs[w] = (freqs[w] || 0) + 1;
      }
    });

    wordFrequencies = Object.entries(freqs)
      .map(([text, value]) => ({ text, value, porcentaje: Number(((value / totalValidTasks) * 100).toFixed(1)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Top 15 para el gráfico de barras horizontales
  } catch (e) {
    console.error("Error generating word cloud:", e);
  }

  // 7. Detector de Cuellos de Botella (Módulo 3)
  const bottlenecksByPerson = new Map<string, { total: number, trabadas: number, tareasIds: string[] }>();
  const bottlenecksByType = new Map<string, { total: number, trabadas: number, tareasIds: string[] }>();

  filteredTasks.forEach(t => {
    // Un cuello de botella es una acumulación de tareas Vencidas o muchas tareas En Proceso en simultáneo.
    const isTrabada = t.estado === 'Vencida' || t.estado === 'En proceso'; 
    
    if (t.docenteVinculado) {
      if (!bottlenecksByPerson.has(t.docenteVinculado)) bottlenecksByPerson.set(t.docenteVinculado, { total: 0, trabadas: 0, tareasIds: [] });
      const b = bottlenecksByPerson.get(t.docenteVinculado)!;
      b.total += 1;
      if (isTrabada) { b.trabadas += 1; b.tareasIds.push(t.id); }
    }
    
    if (t.tipo) {
      if (!bottlenecksByType.has(t.tipo)) bottlenecksByType.set(t.tipo, { total: 0, trabadas: 0, tareasIds: [] });
      const b = bottlenecksByType.get(t.tipo)!;
      b.total += 1;
      if (isTrabada) { b.trabadas += 1; b.tareasIds.push(t.id); }
    }
  });

  const getSevereBottlenecks = (map: Map<string, { total: number, trabadas: number, tareasIds: string[] }>) => {
    return Array.from(map.entries())
      .filter(([_, data]) => data.trabadas > 1) // Más de 1 tarea trabada para alertar
      .map(([name, data]) => ({ name, ...data, percentage: Math.round((data.trabadas / data.total) * 100) }))
      .sort((a, b) => b.trabadas - a.trabadas)
      .slice(0, 3);
  };

  const topBottleneckPeople = getSevereBottlenecks(bottlenecksByPerson);
  const topBottleneckTypes = getSevereBottlenecks(bottlenecksByType);

  // 8. KPIs Avanzados (Cultura y Salud Institucional)
  let totalCumplidasValidas = 0;
  let cumplidasATiempo = 0;

  let reactividadCount = 0;
  let colaboracionCount = 0;
  let calidadDocCount = 0;
  let totalCumplidas = 0;

  const parseDateKPI = (dString: string) => {
    if (!dString) return new Date();
    const parts = dString.includes('/') ? dString.split('/') : dString.split('-');
    if (parts.length === 3) {
      return dString.includes('/') ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date();
  };

  const currentMonth = new Date().getMonth();
  let tareasMesActual = 0;

  filteredTasks.forEach(t => {
    // KPI: Resolución a tiempo y Calidad
    if (t.estado === 'Cumplida') {
      totalCumplidas++;
      if (t.fechaCumplimiento && t.fechaVencimiento) {
        totalCumplidasValidas++;
        if (parseDateKPI(t.fechaCumplimiento) <= parseDateKPI(t.fechaVencimiento)) cumplidasATiempo++;
      }

      if (t.evidencia && t.evidencia.trim().length > 5) {
        calidadDocCount++;
      }

      // Desafío global: tareas cumplidas este mes
      if (t.fechaCumplimiento) {
        const d = parseDateKPI(t.fechaCumplimiento);
        if (d.getMonth() === currentMonth) {
          tareasMesActual++;
        }
      }
    }

    // KPI: Reactividad (Bombero)
    if (t.fechaInicio && t.fechaVencimiento && t.fechaInicio === t.fechaVencimiento) {
      reactividadCount++;
    }

    // KPI: Trabajo en red (Colaboración)
    if (t.docenteVinculado && t.docenteVinculado.includes(',')) {
      colaboracionCount++;
    }
  });

  const tasaResolucionATiempo = totalCumplidasValidas > 0 ? Math.round((cumplidasATiempo / totalCumplidasValidas) * 100) : 0;
  const reactividadPct = filteredTasks.length > 0 ? Math.round((reactividadCount / filteredTasks.length) * 100) : 0;
  const colaboracionPct = filteredTasks.length > 0 ? Math.round((colaboracionCount / filteredTasks.length) * 100) : 0;
  const calidadPct = totalCumplidas > 0 ? Math.round((calidadDocCount / totalCumplidas) * 100) : 0;

  // Meta Dinámica: Completar todo el trabajo histórico del sistema (Inbox Zero Global)
  const metaTotal = cumplidas + pendientes + enProceso + vencidas;
  const progresoMeta = metaTotal > 0 ? Math.min(Math.round((cumplidas / metaTotal) * 100), 100) : 0;

  // Framer Motion Variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="space-y-8 relative"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* HEADER DE FILTROS */}
      <AnimatePresence>
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Filtros Activos:</span>
            <div className="flex flex-wrap gap-2 flex-1">
              {Object.entries(activeFilters).map(([key, val]) => (
                <span key={key} className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-700 shadow-sm">
                  {key === 'estado' ? 'Estado' : key === 'prioridad' ? 'Prioridad' : key === 'keyword' ? 'Palabra Clave' : 'Área'}: {val}
                  <button onClick={() => toggleFilter(key, val)} className="hover:text-red-500 rounded-full p-0.5 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Limpiar Todos
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-center shadow-sm cursor-pointer transition-colors">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Tareas</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{total}</p>
        </motion.div>

        <motion.div variants={itemVariants} onClick={() => toggleFilter('estado', 'Cumplida')} whileHover={{ scale: 1.05 }} className={`p-4 rounded-xl border text-center shadow-sm cursor-pointer transition-colors ${activeFilters.estado === 'Cumplida' ? 'bg-green-100 border-green-300 dark:bg-green-900/40' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'}`}>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">Cumplidas</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">{cumplidas}</p>
        </motion.div>

        <motion.div variants={itemVariants} onClick={() => toggleFilter('estado', 'En proceso')} whileHover={{ scale: 1.05 }} className={`p-4 rounded-xl border text-center shadow-sm cursor-pointer transition-colors ${activeFilters.estado === 'En proceso' ? 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/40' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800'}`}>
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">En Proceso</p>
          <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{enProceso}</p>
        </motion.div>

        <motion.div variants={itemVariants} onClick={() => toggleFilter('estado', 'Pendiente')} whileHover={{ scale: 1.05 }} className={`p-4 rounded-xl border text-center shadow-sm cursor-pointer transition-colors ${activeFilters.estado === 'Pendiente' ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/40' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Pendientes</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{pendientes}</p>
        </motion.div>
        
        <motion.div variants={itemVariants} onClick={() => toggleFilter('estado', 'Vencida')} whileHover={{ scale: 1.05 }} className={`p-4 rounded-xl border text-center shadow-sm cursor-pointer transition-colors ${activeFilters.estado === 'Vencida' ? 'bg-red-100 border-red-300 dark:bg-red-900/40' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Vencidas</p>
          <p className="text-3xl font-bold text-red-900 dark:text-red-100">{vencidas}</p>
        </motion.div>
      </div>

      {/* DESAFÍO GLOBAL UNMa */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 shadow-md text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              🏆 Nuestro trabajo en Equipo (Inbox Zero)
            </h2>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Objetivo: Alcanzar el "Inbox Zero". El progreso se calcula en base a todas las tareas de la institución que no están canceladas.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black">{progresoMeta}%</p>
            <p className="text-xs text-indigo-200 uppercase tracking-wide font-semibold">{cumplidas} de {metaTotal} completadas</p>
          </div>
        </div>

        <div className="relative z-10 mt-4 bg-indigo-950/50 rounded-full h-4 overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progresoMeta}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full relative"
          >
            <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIi8+PC9nPjwvc3ZnPg==')] opacity-50"></div>
          </motion.div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 left-10 w-40 h-40 bg-purple-900 opacity-40 rounded-full blur-2xl"></div>
      </motion.div>

      {/* KPIs DE CULTURA Y SALUD INSTITUCIONAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors relative overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Resolución a Tiempo</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{tasaResolucionATiempo}%</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Tareas cumplidas antes de vencer</p>
          <div className="absolute bottom-0 left-0 h-1 bg-green-500" style={{ width: `${tasaResolucionATiempo}%` }}></div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors relative overflow-hidden" title="Alto = Modo bombero (planificación pobre)">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-help">Tasa de Reactividad</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{reactividadPct}%</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Creadas y vencidas el mismo día</p>
          <div className="absolute bottom-0 left-0 h-1 bg-red-500" style={{ width: `${reactividadPct}%` }}></div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors relative overflow-hidden" title="Porcentaje de tareas con múltiples personas vinculadas">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-help">Trabajo en Red</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{colaboracionPct}%</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Tareas multidisciplinarias (Equipos)</p>
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500" style={{ width: `${colaboracionPct}%` }}></div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors relative overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-help" title="Mide si documentan la tarea al cerrarla">Calidad Documental</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{calidadPct}%</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Cumplidas que anexan evidencia</p>
          <div className="absolute bottom-0 left-0 h-1 bg-purple-500" style={{ width: `${calidadPct}%` }}></div>
        </motion.div>
      </div>

      {/* PRIMERA FILA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* GRÁFICO ESTADOS (TORTA) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm h-80 hover:shadow-md transition-shadow">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 cursor-help" title="Haz clic en una porción para filtrar">Estado Global (Interactivo)</h3>
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
                stroke="none"
                onClick={(data) => toggleFilter('estado', data?.payload?.rawName || '')}
                className="cursor-pointer"
              >
                {dataPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={activeFilters.estado && activeFilters.estado !== entry.rawName ? 0.3 : 1} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend onClick={(data: any) => {
                const found = dataPie.find(d => d.name === data.value);
                if (found) toggleFilter('estado', found.rawName);
              }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* GRÁFICO EVOLUCIÓN (BARRAS POR DÍA) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm lg:col-span-2 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 cursor-help" title="Haz clic en una barra para ver y actualizar las tareas de ese día">Evolución de Tareas Creadas (Interactiva)</h3>
          <p className="text-[11px] text-center text-gray-400 mb-3">Haz clic en los recuadros para gestionar las tareas del día</p>
          
          <div className="h-64 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dataTimeline} 
                margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                  cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} 
                />
                <Bar 
                  dataKey="Cumplidas" stackId="a" fill="#22c55e" maxBarSize={40}
                  onClick={(data: any) => { const tareas = data?.payload?.tareas || data?.tareas; if (tareas) setSelectedDayTasks(tareas); }}
                />
                <Bar 
                  dataKey="En Proceso" stackId="a" fill="#eab308" maxBarSize={40}
                  onClick={(data: any) => { const tareas = data?.payload?.tareas || data?.tareas; if (tareas) setSelectedDayTasks(tareas); }}
                />
                <Bar 
                  dataKey="Pendientes" stackId="a" fill="#3b82f6" maxBarSize={40}
                  onClick={(data: any) => { const tareas = data?.payload?.tareas || data?.tareas; if (tareas) setSelectedDayTasks(tareas); }}
                />
                <Bar 
                  dataKey="Vencidas" stackId="a" fill="#ef4444" maxBarSize={40}
                  onClick={(data: any) => { const tareas = data?.payload?.tareas || data?.tareas; if (tareas) setSelectedDayTasks(tareas); }}
                />
                <Bar 
                  dataKey="Canceladas" stackId="a" fill="#9ca3af" maxBarSize={40}
                  onClick={(data: any) => { const tareas = data?.payload?.tareas || data?.tareas; if (tareas) setSelectedDayTasks(tareas); }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <AnimatePresence>
            {selectedDayTasks.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">
                    Tareas del {selectedDayTasks[0].fechaInicio}:
                  </h4>
                  <button onClick={() => setSelectedDayTasks([])} className="text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"><X className="w-3 h-3"/></button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {selectedDayTasks.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm text-sm hover:border-blue-300 transition-colors group">
                      <span className="truncate pr-4 text-gray-700 dark:text-gray-200 font-medium text-xs">
                        {t.descripcion ? (t.descripcion.length > 60 ? t.descripcion.substring(0, 60) + '...' : t.descripcion) : 'Sin descripción'}
                      </span>
                      <button 
                        onClick={() => onUpdateClick && onUpdateClick(t.id)}
                        className="shrink-0 bg-blue-100 hover:bg-blue-600 dark:bg-blue-900/50 dark:hover:bg-blue-600 text-blue-700 hover:text-white dark:text-blue-300 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm"
                      >
                        Actualizar
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* SEGUNDA FILA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* RENDIMIENTO POR ÁREA (BARRAS) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm h-80 lg:col-span-2 hover:shadow-md transition-shadow">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 cursor-help" title="Haz clic en una columna para filtrar por Área">Rendimiento por Área (Interactivo)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataBar}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              onClick={(state) => {
                if (state && state.activeLabel) toggleFilter('area', String(state.activeLabel));
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis tick={{ fontSize: 12, fill: '#888' }} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Legend />
              <Bar dataKey="Cumplidas" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} opacity={activeFilters.estado && activeFilters.estado !== 'Cumplida' ? 0.3 : 1} />
              <Bar dataKey="EnProceso" stackId="a" fill="#eab308" opacity={activeFilters.estado && activeFilters.estado !== 'En proceso' ? 0.3 : 1} />
              <Bar dataKey="Pendientes" stackId="a" fill="#3b82f6" opacity={activeFilters.estado && activeFilters.estado !== 'Pendiente' ? 0.3 : 1} />
              <Bar dataKey="Vencidas" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={activeFilters.estado && activeFilters.estado !== 'Vencida' ? 0.3 : 1} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* TOP PERSONAL / PRIORIDADES */}
        <div className="flex flex-col gap-6">
          {/* PRIORIDADES (Reducido de tamaño) */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 cursor-help" title="Haz clic para filtrar por Prioridad">Urgencia (Interactivo)</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPrioridad}
                    cx="50%" cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    stroke="none"
                    onClick={(data: any) => toggleFilter('prioridad', data.name || '')}
                    className="cursor-pointer"
                  >
                    {dataPrioridad.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} opacity={activeFilters.prioridad && activeFilters.prioridad !== entry.name ? 0.3 : 1} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend onClick={(data: any) => toggleFilter('prioridad', data.value || '')} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex-1 overflow-hidden hover:shadow-md transition-shadow">
            <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top Personal Vinculado</h3>
            <div className="space-y-3">
              {topPersonal.length > 0 ? topPersonal.map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 truncate pr-2 font-medium">{doc.name}</span>
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold text-xs">{doc.Tareas}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center mt-6">Sin datos aún</p>
              )}
            </div>
          </motion.div>
        </div>

      </div>

      {/* TERCERA FILA: NUBE DE PALABRAS SEMÁNTICA */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 cursor-help" title="Haz clic en una barra para filtrar por palabra clave">Frecuencia de Palabras Clave (Interactivo)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Temas más repetidos (Haz clic en una barra para filtrar tareas)</p>
          </div>
          <div className="w-full h-80 pr-10">
            {wordFrequencies.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={wordFrequencies}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                  onClick={(state) => {
                    if (state && state.activeLabel) toggleFilter('keyword', String(state.activeLabel));
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="text" type="category" width={100} tick={{ fontSize: 12, fill: '#888', fontWeight: 500 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" name="Apariciones" radius={[0, 4, 4, 0]}>
                    {wordFrequencies.map((entry, index) => {
                      let color = '#22c55e'; // Verde para las más utilizadas
                      if (index >= 5 && index < 10) color = '#eab308'; // Amarillo medio
                      if (index >= 10) color = '#ef4444'; // Rojo para las menos
                      
                      const isMuted = activeFilters.keyword && activeFilters.keyword !== entry.text;
                      return <Cell key={`cell-${index}`} fill={color} opacity={isMuted ? 0.3 : 1} />;
                    })}
                    <LabelList dataKey="porcentaje" position="right" formatter={(v: any) => `${v}%`} fill="#888" fontSize={11} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500">No hay suficientes datos para generar el gráfico.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* CUARTA FILA: DETECTOR DE CUELLOS DE BOTELLA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <motion.div variants={itemVariants} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🚦</span>
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Alerta de Cuellos de Botella (Personal)</h3>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            Acumulación de tareas <b>En proceso</b> o <b>Vencidas</b>. Se sugiere reunión de seguimiento.
          </p>
          <div className="space-y-3">
            {topBottleneckPeople.length > 0 ? topBottleneckPeople.map((b, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-100 dark:border-red-900/50 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.trabadas} tareas estancadas (de {b.total} totales)</p>
                </div>
                <button 
                  onClick={() => toggleFilter('persona', b.name)}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800 text-red-700 dark:text-red-300 text-xs font-bold rounded-md transition-colors"
                >
                  Revisar
                </button>
              </div>
            )) : (
              <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center font-medium">
                ¡Excelente! No se detectan sobrecargas críticas en el personal.
              </p>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚠️</span>
            <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300">Procesos Estancados (Por Área/Tipo)</h3>
          </div>
          <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
            Tipos de tareas con mayor volumen de bloqueos o retrasos actuales.
          </p>
          <div className="space-y-3">
            {topBottleneckTypes.length > 0 ? topBottleneckTypes.map((b, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-100 dark:border-orange-900/50 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.trabadas} tareas críticas ({b.percentage}% del total)</p>
                </div>
                <button 
                  onClick={() => toggleFilter('area', b.name)}
                  className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/50 dark:hover:bg-orange-800 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-md transition-colors"
                >
                  Filtrar
                </button>
              </div>
            )) : (
              <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center font-medium">
                Todos los tipos de procesos fluyen correctamente.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
