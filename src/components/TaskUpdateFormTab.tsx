'use client';

import { useState } from 'react';
import { createTaskAction, updateTaskAction } from '@/actions/tasks';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import CommentsSection from './CommentsSection';

export default function TaskUpdateFormTab({ tasks, selectedTaskId, onSuccess }: { tasks: any[], selectedTaskId: string | null, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  
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

    try {
      if (isUpdating && taskDetails) {
        // Update logic (only updating state, date and evidence for simplicity, as per previous logic)
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {isUpdating ? 'Actualizar Tarea' : 'Cargar Nueva Tarea'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {isUpdating ? 'Actualiza el estado y la evidencia de tu tarea.' : 'Completa los detalles para registrar una nueva tarea en tu historial.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
        
        {/* CREATE FIELDS */}
        {!isUpdating && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">Tipo de Tarea *</label>
                <select id="tipo" name="tipo" required className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none">
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
                <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-2">Prioridad *</label>
                <select id="prioridad" name="prioridad" required className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none">
                  <option value="">Selecciona prioridad...</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio *</label>
                <input type="date" id="fechaInicio" name="fechaInicio" required className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none" />
              </div>
              <div>
                <label htmlFor="fechaVencimiento" className="block text-sm font-medium text-gray-700 mb-2">Fecha de Vencimiento *</label>
                <input type="date" id="fechaVencimiento" name="fechaVencimiento" required className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">Descripción / Detalle de la Tarea *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                required
                rows={3}
                placeholder="Ej. Cargar actas de examen de la mesa de Febrero..."
                className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none resize-none"
              ></textarea>
            </div>

            <div>
              <label htmlFor="entregable" className="block text-sm font-medium text-gray-700 mb-2">Resultado Esperado / Entregable *</label>
              <input
                type="text"
                id="entregable"
                name="entregable"
                required
                placeholder="Ej. Actas firmadas en PDF"
                className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>
          </>
        )}

        {/* UPDATE INFO (READONLY) */}
        {isUpdating && taskDetails && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <h4 className="font-semibold text-gray-900">{taskDetails.entregable || taskDetails.tipo}</h4>
            <p className="text-sm text-gray-500 mt-1">{taskDetails.descripcion}</p>
          </div>
        )}

        {/* COMMON FIELDS (STATUS, EVIDENCE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
            <select
              id="estado"
              name="estado"
              required
              defaultValue={isUpdating ? taskDetails?.estado : 'Pendiente'}
              className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Cumplida">Cumplida</option>
              <option value="Vencida">Vencida</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label htmlFor="fechaCumplimiento" className="block text-sm font-medium text-gray-700 mb-2">Fecha de Cumplimiento</label>
            <input
              type="date"
              id="fechaCumplimiento"
              name="fechaCumplimiento"
              defaultValue={isUpdating ? formatDateForInput(taskDetails?.fechaCumplimiento) : ''}
              className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="evidencia" className="block text-sm font-medium text-gray-700 mb-2">Enlace de Evidencia (Opcional)</label>
            <input
              type="url"
              id="evidencia"
              name="evidencia"
              defaultValue={isUpdating ? taskDetails?.evidencia : ''}
              placeholder="https://drive..."
              className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
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
