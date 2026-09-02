'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Calendar, CheckCircle2, Clock, ExternalLink, Search, FileText, FileDown, LayoutGrid, List, Columns, Mail, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TaskListTab({ tasks, onUpdateClick }: { tasks: any[], onUpdateClick: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [cargoFilter, setCargoFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [kanbanLimits, setKanbanLimits] = useState<Record<string, number>>({});
  const itemsPerPage = 10;

  const getStatusLabel = (task: any) => {
    if (task.estado === 'Vencida') return 'Vencida';
    if (task.estado === 'Cumplida') return 'Cumplida';
    if (task.estado === 'Cancelada') return 'Cancelada';
    if (task.estado === 'En proceso') return 'En proceso';
    
    if (task.fechaVencimiento && task.estado !== 'Cumplida' && task.estado !== 'Cancelada') {
      const today = new Date();
      const parts = task.fechaVencimiento.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const limitDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const diffTime = limitDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Vencida';
      }
    }
    return task.estado || 'Pendiente';
  };

  const getStatusColor = (task: any) => {
    const label = getStatusLabel(task);
    if (label === 'Cumplida') return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
    if (label === 'Cancelada') return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    if (label === 'Vencida') return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900';
    if (label === 'En proceso') return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900';
    
    return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900';
  };

  const getEmailLink = (task: any) => {
    const subject = encodeURIComponent(`Seguimiento de Tarea: ${task.tipo}`);
    const body = encodeURIComponent(`Hola ${task.docenteVinculado},\n\nTe escribo en relación a la siguiente tarea asignada:\n\n- Tipo: ${task.tipo}\n- Descripción: ${task.descripcion}\n- Fecha de Vencimiento: ${task.fechaVencimiento || 'No definida'}\n\nPor favor, avísame si tienes dudas.\n\nSaludos.`);
    return `mailto:${task.docenteEmail}?subject=${subject}&body=${body}`;
  };

  const getWhatsAppLink = (task: any) => {
    const text = encodeURIComponent(`Hola ${task.docenteVinculado}, te escribo por la tarea: *${task.tipo}*.\nDetalle: ${task.descripcion}\nVencimiento: ${task.fechaVencimiento || 'No definida'}.`);
    return `https://wa.me/${task.docenteTelefono.replace(/\D/g, '')}?text=${text}`;
  };

  const filteredTasks = tasks?.filter(task => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      (task.tipo || '').toLowerCase().includes(term) ||
      (task.descripcion || '').toLowerCase().includes(term) ||
      (task.entregable || '').toLowerCase().includes(term) ||
      (task.estado || '').toLowerCase().includes(term) ||
      (task.id || '').toLowerCase().includes(term) ||
      (task.area || '').toLowerCase().includes(term) ||
      (task.nombreAsignado || '').toLowerCase().includes(term) ||
      (task.docenteVinculado || '').toLowerCase().includes(term)
    );
    
    const matchesStatus = statusFilter === 'Todas' ? true : getStatusLabel(task) === statusFilter;
    const matchesCargo = cargoFilter === 'Todos' ? true : task.cargo === cargoFilter;

    return matchesSearch && matchesStatus && matchesCargo;
  })?.slice().reverse() || [];

  // Paginación Tabla/Cards
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reiniciar página si cambian los filtros
  useState(() => {
    setCurrentPage(1);
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Tareas - Seguimiento UNMa", 14, 15);
    
    const tableData = filteredTasks.map(t => [
      t.id, t.nombreAsignado + ' ' + t.apellidoAsignado, t.docenteVinculado || '-', t.area, t.tipo, getStatusLabel(t), t.fechaVencimiento
    ]);
    
    autoTable(doc, {
      startY: 20,
      head: [['ID', 'Asignado a', 'Docente', 'Área', 'Tipo', 'Estado', 'Vencimiento']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save("Reporte_Tareas.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTasks.map(t => ({
      ID: t.id,
      DNI: t.dniAsignado,
      Asignado: `${t.nombreAsignado} ${t.apellidoAsignado}`,
      Docente_Vinculado: t.docenteVinculado,
      Area: t.area,
      Cargo: t.cargo,
      Tipo: t.tipo,
      Descripcion: t.descripcion,
      Entregable: t.entregable,
      Prioridad: t.prioridad,
      Estado: getStatusLabel(t),
      Fecha_Inicio: t.fechaInicio,
      Fecha_Vencimiento: t.fechaVencimiento,
      Fecha_Cumplimiento: t.fechaCumplimiento,
      Evidencia: t.evidencia
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tareas");
    XLSX.writeFile(wb, "Reporte_Tareas.xlsx");
  };

  const renderCard = (task: any) => (
    <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task)}`}>
          {getStatusLabel(task)}
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          Prioridad {task.prioridad}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-2 line-clamp-2">
        {task.tipo}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3 flex-grow">
        <span className="font-medium text-gray-700 dark:text-gray-300">Ref: </span>
        {task.descripcion?.substring(0, 100)}{task.descripcion?.length > 100 ? '...' : ''}
      </p>

      {task.docenteVinculado && (
        <div className="mb-3">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2">
            Docente: {task.docenteVinculado}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {task.docenteEmail && (
              <a href={getEmailLink(task)} title="Enviar Email" className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-400 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            )}
            {task.docenteTelefono && (
              <a href={getWhatsAppLink(task)} target="_blank" rel="noopener noreferrer" title="Enviar WhatsApp" className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/50 dark:hover:text-green-400 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-5">
        {task.fechaVencimiento && (
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-2" />
            Vence: {task.fechaVencimiento}
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4 mr-2" />
          Estado: {getStatusLabel(task)}
        </div>
        {task.evidencia && (
          <a href={task.evidencia} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Evidencia
          </a>
        )}
      </div>

      <button
        onClick={() => onUpdateClick(task.id)}
        className="w-full mt-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
      >
        Actualizar Tarea
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar por descripción, docente, tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="Todas">Todas las tareas</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Cumplida">Cumplida</option>
            <option value="Vencida">Vencida</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          {/* Cargo Filter */}
          <select 
            value={cargoFilter} 
            onChange={(e) => setCargoFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="Todos">Todos los cargos</option>
            <option value="Admin">Admin</option>
            <option value="Asistente Digital">Asistente Digital</option>
            <option value="Director/ra">Director/ra</option>
            <option value="Coordinador/ra">Coordinador/ra</option>
            <option value="Articuladores">Articuladores</option>
            <option value="TICS">TICS</option>
            <option value="Jefe de Departamento Educación en Contextos de Encierro">Jefe de Departamento Educación en Contextos de Encierro</option>
            <option value="Otro">Otro</option>
          </select>

          {/* View Toggles */}
          <div className="flex bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              title="Vista Lista"
            >
              <List className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setViewMode('cards')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              title="Vista Tarjetas"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setViewMode('kanban')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              title="Vista Kanban"
            >
              <Columns className="h-5 w-5" />
            </button>
          </div>

          <button onClick={exportPDF} className="flex items-center px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl transition-colors dark:bg-red-900/30 dark:text-red-400 dark:border-red-900" title="Exportar PDF">
            <FileText className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline text-sm font-medium">PDF</span>
          </button>
          <button onClick={exportExcel} className="flex items-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-xl transition-colors dark:bg-green-900/30 dark:text-green-400 dark:border-green-900" title="Exportar Excel">
            <FileDown className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline text-sm font-medium">Excel</span>
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No se encontraron tareas</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Prueba con otra búsqueda o filtro.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTasks.map(renderCard)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Página {currentPage} de {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"><ChevronLeft className="w-5 h-5"/></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"><ChevronRight className="w-5 h-5"/></button>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {['Pendiente', 'En proceso', 'Cumplida', 'Vencida', 'Cancelada'].map(status => {
            const allColumnTasks = filteredTasks.filter(t => getStatusLabel(t) === status);
            const limit = kanbanLimits[status] || 10;
            const columnTasks = allColumnTasks.slice(0, limit);
            const hasMore = allColumnTasks.length > limit;

            return (
              <div key={status} className="flex flex-col bg-gray-100/50 dark:bg-gray-800/20 rounded-xl p-3 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">{status}</h4>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs py-1 px-2 rounded-full font-medium">
                    {allColumnTasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {columnTasks.map(renderCard)}
                  {columnTasks.length === 0 && (
                    <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center text-sm text-gray-500 dark:text-gray-500">
                      Sin tareas
                    </div>
                  )}
                  {hasMore && (
                    <button 
                      onClick={() => setKanbanLimits(prev => ({ ...prev, [status]: limit + 10 }))}
                      className="w-full py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
                    >
                      Ver más tareas
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vista de Tabla (Solo en PC/Tablet) */}
          <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Tipo / Referencia</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Docente Vinculado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{task.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{task.tipo}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={task.descripcion}>
                      {task.descripcion}
                    </div>
                  </td>
                  <td className="px-4 py-3">{task.nombreAsignado} {task.apellidoAsignado}</td>
                  <td className="px-4 py-3">
                    {task.docenteVinculado ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">{task.docenteVinculado}</span>
                        <div className="flex items-center gap-1">
                          {task.docenteEmail && (
                            <a href={getEmailLink(task)} title="Email" className="text-gray-400 hover:text-blue-500 transition-colors">
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {task.docenteTelefono && (
                            <a href={getWhatsAppLink(task)} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-gray-400 hover:text-green-500 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task)}`}>
                      {getStatusLabel(task)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{task.fechaVencimiento}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onUpdateClick(task.id)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Actualizar
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
          
          {/* Vista de Tarjetas (Solo en Celulares) */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {paginatedTasks.map(renderCard)}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Página {currentPage} de {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"><ChevronLeft className="w-5 h-5"/></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"><ChevronRight className="w-5 h-5"/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
