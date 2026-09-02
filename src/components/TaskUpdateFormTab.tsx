'use client';

import { useState, useEffect } from 'react';
import { createTaskAction, updateTaskAction, getDocentes } from '@/actions/tasks';
import { toast } from 'sonner';
import { Loader2, Mail, MessageCircle } from 'lucide-react';
import CommentsSection from './CommentsSection';

export default function TaskUpdateFormTab({ tasks, selectedTaskId, onSuccess }: { tasks: any[], selectedTaskId: string | null, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState<{id: string, nombre: string, email: string, telefono: string}[]>([]);
  const [selectedDocente, setSelectedDocente] = useState('');
  const activeDocente = docentes.find(d => d.nombre === selectedDocente);

  
  useEffect(() => {
    getDocentes().then(setDocentes).catch(console.error);
  }, []);
  
  // If selectedTaskId exists, we are UPDATING. Otherwise, we are CREATING.
  const isUpdating = !!selectedTaskId;
  const taskDetails = isUpdating ? tasks.find(t => t.id === selectedTaskId) : null;

  const formatDateForInput = (d: string) => {
    if (!d) return '';
    const parts = d.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return d;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    const formData = new FormData(form);
    
    // Si hay un docente vinculado, asegurarnos que envíe los datos de contacto
    const activeDocente = docentes.find(d => d.nombre === formData.get('docenteVinculado'));
    if (activeDocente) {
      formData.set('docenteEmail', activeDocente.email);
      formData.set('docenteTelefono', activeDocente.telefono);
    }

    try {
      if (isUpdating && taskDetails) {
        // Update logic
        const estado = formData.get('estado')?.toString() || 'Pendiente';
        const fechaCumplimiento = formData.get('fechaCumplimiento')?.toString() || '';
        const evidencia = formData.get('evidencia')?.toString() || '';
        await updateTaskAction(taskDetails.rowIndex, estado, evidencia, fechaCumplimiento);
        toast.success('Tarea actualizada correctamente');
      } else {
        // Create logic
        await createTaskAction(formData);
        toast.success('Nueva tarea registrada correctamente');
        form.reset();
      }
      onSuccess();
    } catch (error: any) {
      console.error("ERROR FORM SUBMIT:", error);
      toast.error('Error al guardar la tarea: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  }

  const inputClasses = "block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none dark:text-white transition-colors";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {isUpdating ? 'Actualizar Tarea' : 'Cargar Nueva Tarea'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isUpdating ? 'Actualiza el estado y la evidencia de tu tarea.' : 'Completa los detalles para registrar una nueva tarea en tu historial.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800 transition-colors">
        
        {/* CREATE FIELDS */}
        {!isUpdating && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tipo" className={labelClasses}>Tipo de Tarea *</label>
                <select id="tipo" name="tipo" required className={inputClasses}>
                  <option value="">Selecciona una opción...</option>
                  <option value="Administrativa">Administrativa</option>
                  <option value="Académica">Académica</option>
                  <option value="Atención y orientación">Atención y orientación</option>
                  <option value="Gestión documental">Gestión documental</option>
                  <option value="Tecnológica">Tecnológica</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>

              <div>
                <label htmlFor="prioridad" className={labelClasses}>Prioridad *</label>
                <select id="prioridad" name="prioridad" required className={inputClasses}>
                  <option value="">Selecciona prioridad...</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="docenteVinculado" className={labelClasses}>Docente Vinculado (Buscador - Opcional)</label>
              <input 
                id="docenteVinculado" 
                name="docenteVinculado" 
                list="docentes-list" 
                className={inputClasses}
                placeholder="Escribe para buscar..."
                value={selectedDocente}
                onChange={(e) => setSelectedDocente(e.target.value)}
              />
              <datalist id="docentes-list">
                {docentes.map((d, i) => (
                  <option key={i} value={d.nombre}>{d.nombre}</option>
                ))}
              </datalist>
              {activeDocente && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Docente seleccionado</p>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                      {activeDocente.email ? activeDocente.email : 'Sin email registrado'}
                      {' • '}
                      {activeDocente.telefono ? activeDocente.telefono : 'Sin teléfono'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {activeDocente.email && (
                      <a 
                        href={`mailto:${activeDocente.email}?subject=${encodeURIComponent('Seguimiento de Tarea')}&body=${encodeURIComponent(`Hola ${activeDocente.nombre},\n\nTe escribo en relación a una tarea asignada en el sistema.\n\nSaludos.`)}`} 
                        title="Enviar Email" 
                        className="p-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors shadow-sm"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {activeDocente.telefono && (
                      <a 
                        href={`https://wa.me/${activeDocente.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${activeDocente.nombre}, te escribo por una tarea que te acabo de asignar en el sistema.`)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Enviar WhatsApp" 
                        className="p-2 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaInicio" className={labelClasses}>Fecha de Inicio *</label>
                <input type="date" id="fechaInicio" name="fechaInicio" required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="fechaVencimiento" className={labelClasses}>Fecha de Vencimiento *</label>
                <input type="date" id="fechaVencimiento" name="fechaVencimiento" required className={inputClasses} />
              </div>
            </div>

            <div>
              <label htmlFor="descripcion" className={labelClasses}>Descripción / Detalle de la Tarea *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                required
                rows={3}
                placeholder="Ej. Cargar actas de examen de la mesa de Febrero..."
                className={`${inputClasses} resize-none`}
              ></textarea>
            </div>

            <div>
              <label htmlFor="entregable" className={labelClasses}>Resultado Esperado / Entregable *</label>
              <input
                type="text"
                id="entregable"
                name="entregable"
                required
                placeholder="Ej. Actas firmadas en PDF"
                className={inputClasses}
              />
            </div>
          </>
        )}

        {/* UPDATE INFO (READONLY) */}
        {isUpdating && taskDetails && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 transition-colors">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{taskDetails.entregable || taskDetails.tipo}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{taskDetails.descripcion}</p>
            {taskDetails.docenteVinculado && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-2">Docente: {taskDetails.docenteVinculado}</p>
            )}
          </div>
        )}

        {/* COMMON FIELDS (STATUS, EVIDENCE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="estado" className={labelClasses}>Estado *</label>
            <select
              id="estado"
              name="estado"
              required
              defaultValue={isUpdating ? taskDetails?.estado : 'Pendiente'}
              className={inputClasses}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Cumplida">Cumplida</option>
              <option value="Vencida">Vencida</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label htmlFor="fechaCumplimiento" className={labelClasses}>Fecha de Cumplimiento</label>
            <input
              type="date"
              id="fechaCumplimiento"
              name="fechaCumplimiento"
              defaultValue={isUpdating ? formatDateForInput(taskDetails?.fechaCumplimiento) : ''}
              className={inputClasses}
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="evidencia" className={labelClasses}>Enlace de Evidencia (Opcional)</label>
            <input
              type="url"
              id="evidencia"
              name="evidencia"
              defaultValue={isUpdating ? taskDetails?.evidencia : ''}
              placeholder="https://drive..."
              className={inputClasses}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {isUpdating ? 'Cancelar' : 'Volver al Inicio'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
            {isUpdating ? 'Guardar Cambios' : 'Registrar Tarea'}
          </button>
        </div>
      </form>

      {isUpdating && selectedTaskId && (
        <CommentsSection taskId={selectedTaskId} />
      )}
    </div>
  );
}
