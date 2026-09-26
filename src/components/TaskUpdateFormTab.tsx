'use client';

import { useState, useEffect } from 'react';
import { createTaskAction, updateTaskAction, getDocentes, deleteTaskAction } from '@/actions/tasks';
import { toast } from 'sonner';
import { Loader2, Mail, MessageCircle, ChevronDown, UploadCloud } from 'lucide-react';
import CommentsSection from './CommentsSection';

export default function TaskUpdateFormTab({ tasks, selectedTaskId, onSuccess }: { tasks: any[], selectedTaskId: string | null, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState<{id: string, nombre: string, email: string, telefono: string}[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [descripcionText, setDescripcionText] = useState('');
  const [autoPriority, setAutoPriority] = useState<string | null>(null);
  const [isPersonasOpen, setIsPersonasOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Obtener array de todos los seleccionados
  const activeDocentes = docentes.filter(d => selectedPersonas.includes(d.nombre));

  
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
    
    // Unir las personas vinculadas en un string separado por comas
    formData.set('docenteVinculado', selectedPersonas.join(', '));

    // Si hay un docente vinculado, asegurarnos que envíe los datos de contacto
    const activeDoc = docentes.find(d => selectedPersonas.includes(d.nombre));
    if (activeDoc) {
      formData.set('docenteEmail', activeDoc.email);
      formData.set('docenteTelefono', activeDoc.telefono);
    }

    try {
      const estado = formData.get('estado')?.toString() || 'Pendiente';
      const evidencia = formData.get('evidencia')?.toString() || '';
      
      // Validaciones Preventivas
      if (estado === 'Vencida') {
        const fechaVenc = isUpdating && taskDetails ? taskDetails.fechaVencimiento : formData.get('fechaVencimiento')?.toString();
        if (fechaVenc) {
          let vDate = null;
          if (fechaVenc.includes('/')) {
            const parts = fechaVenc.split('/');
            vDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else if (fechaVenc.includes('-')) {
            const parts = fechaVenc.split('-');
            vDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
          
          if (vDate) {
            const today = new Date();
            today.setHours(0,0,0,0);
            if (vDate >= today) {
              const confirm = window.confirm('La fecha de vencimiento de esta tarea aún no ha pasado. ¿Estás seguro de que deseas forzar su estado a "Vencida" de manera prematura?');
              if (!confirm) {
                setLoading(false);
                return;
              }
            }
          }
        }
      }

      if (estado === 'Cumplida' && !evidencia) {
        const confirm = window.confirm('Estás marcando la tarea como "Cumplida" sin adjuntar ningún Enlace de Evidencia. ¿Deseas continuar de todos modos?');
        if (!confirm) {
          setLoading(false);
          return;
        }
      }

      if (isUpdating && taskDetails) {
        // Update logic
        const fechaCumplimiento = formData.get('fechaCumplimiento')?.toString() || '';
        await updateTaskAction(taskDetails.id, estado, evidencia, fechaCumplimiento);
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

  const handleFileUpload = async (file: File) => {
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx');

    if (!isPDF && !isWord && !isExcel) {
      toast.error('Por favor, sube un archivo PDF, Word (.docx) o Excel (.xlsx).');
      return;
    }
    
    setLoading(true);
    toast.info(`Extrayendo texto del ${isPDF ? 'PDF' : isWord ? 'Word' : 'Excel'} localmente...`);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      let fullText = '';

      if (isPDF) {
        if (!(window as any).pdfjsLib) {
           await new Promise((resolve, reject) => {
             const script = document.createElement('script');
             script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
             script.onload = () => {
               (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
               resolve(true);
             };
             script.onerror = reject;
             document.body.appendChild(script);
           });
        }
        const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = Math.min(pdf.numPages, 1);
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + ' ';
        }
      } 
      else if (isWord) {
        if (!(window as any).mammoth) {
          await new Promise((resolve, reject) => {
             const script = document.createElement('script');
             script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
             script.onload = resolve;
             script.onerror = reject;
             document.body.appendChild(script);
          });
        }
        const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
        fullText = result.value;
      }
      else if (isExcel) {
        if (!(window as any).XLSX) {
          await new Promise((resolve, reject) => {
             const script = document.createElement('script');
             script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
             script.onload = resolve;
             script.onerror = reject;
             document.body.appendChild(script);
          });
        }
        const workbook = (window as any).XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        fullText = (window as any).XLSX.utils.sheet_to_txt(firstSheet);
      }
      
      const words = fullText.replace(/\s+/g, ' ').trim().split(' ');
      const first100 = words.slice(0, 100).join(' ');
      
      setDescripcionText(first100 + (words.length > 100 ? '...' : ''));
      
      const lowerText = first100.toLowerCase();
      if (/(urgente|inmediato|crítico|falla|caída|rotura|error|problema|bloqueo)/.test(lowerText)) {
        setAutoPriority('Alta');
      }
      
      toast.success('¡Las primeras 100 palabras se extrajeron exitosamente!');
    } catch (error) {
      console.error(error);
      toast.error('Error al leer el archivo. Asegúrate de que sea un PDF, DOCX o XLSX válido.');
    } finally {
      setLoading(false);
    }
  };

  async function handleDelete() {
    if (!isUpdating || !taskDetails) return;
    const confirm = window.confirm('🚨 ¿Estás completamente seguro de que deseas ELIMINAR esta tarea? Esta acción la borrará del sistema de forma permanente y no se puede deshacer.');
    if (!confirm) return;

    setLoading(true);
    try {
      await deleteTaskAction(taskDetails.id);
      toast.success('Tarea eliminada correctamente');
      onSuccess();
    } catch (error: any) {
      toast.error('Error al eliminar la tarea: ' + (error.message || ''));
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
                <label htmlFor="prioridad" className={labelClasses}>
                  Prioridad * 
                  {autoPriority && (
                    <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      Auto-detectada
                    </span>
                  )}
                </label>
                <select 
                  id="prioridad" 
                  name="prioridad" 
                  required 
                  className={inputClasses}
                  value={autoPriority || undefined}
                  onChange={(e) => setAutoPriority(e.target.value)}
                >
                  <option value="">Selecciona prioridad...</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className={labelClasses}>Personas vinculadas (Selección múltiple - Opcional)</label>
              
              <div 
                onClick={() => setIsPersonasOpen(!isPersonasOpen)}
                className={`flex justify-between items-center cursor-pointer ${inputClasses} py-3 select-none`}
              >
                <span className={selectedPersonas.length > 0 ? "text-gray-900 dark:text-gray-100 font-medium text-sm" : "text-gray-500 dark:text-gray-400 text-sm"}>
                  {selectedPersonas.length > 0 ? `${selectedPersonas.length} persona(s) seleccionada(s)` : 'Desplegar para buscar personal...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isPersonasOpen ? 'rotate-180' : ''}`} />
              </div>

              {isPersonasOpen && (
                <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3">
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Buscar personal por nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-3 py-2 mb-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:text-white transition-colors"
                    />
                    {docentes.length === 0 && <span className="text-sm text-gray-500">Cargando usuarios...</span>}
                    {docentes
                      .filter(d => d.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((d, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 dark:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                          checked={selectedPersonas.includes(d.nombre)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPersonas(prev => [...prev, d.nombre]);
                            } else {
                              setSelectedPersonas(prev => prev.filter(p => p !== d.nombre));
                            }
                          }}
                        />
                        {d.nombre}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contactos de los seleccionados */}
              {activeDocentes.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Contactar a:</p>
                  {activeDocentes.map((activeDoc, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100">{activeDoc.nombre}</p>
                        <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                          {activeDoc.email ? activeDoc.email : 'Sin email registrado'}
                          {' • '}
                          {activeDoc.telefono ? activeDoc.telefono : 'Sin teléfono'}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {activeDoc.email && (
                          <a 
                            href={`mailto:${activeDoc.email}?subject=${encodeURIComponent('Seguimiento de Tarea')}&body=${encodeURIComponent(`Hola ${activeDoc.nombre},\n\nTe escribo en relación a una tarea asignada en el sistema.\n\nSaludos.`)}`} 
                            title="Enviar Email" 
                            className="p-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors shadow-sm flex items-center justify-center"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {activeDoc.telefono && (
                          <a 
                            href={`https://wa.me/${activeDoc.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${activeDoc.nombre}, te escribo por una tarea que te acabo de asignar en el sistema.`)}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title="Enviar WhatsApp" 
                            className="p-2 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors shadow-sm flex items-center justify-center"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
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

            <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <label htmlFor="descripcion" className={labelClasses}>Descripción / Detalle de la Tarea *</label>
              
              <textarea
                id="descripcion"
                name="descripcion"
                required
                rows={3}
                placeholder="Ej. Creación del contenido y materiales para los talleres..."
                className={`${inputClasses} resize-none bg-white mb-3`}
                value={descripcionText}
                onChange={(e) => {
                  const text = e.target.value;
                  setDescripcionText(text);
                  
                  const lowerText = text.toLowerCase();
                  if (/(urgente|inmediato|crítico|falla|caída|rotura|error|problema|bloqueo)/.test(lowerText)) {
                    setAutoPriority('Alta');
                  } else if (/(rutina|revisión|control|normal)/.test(lowerText) && autoPriority === 'Alta') {
                    // Solo bajar a Media si estaba en Alta automáticamente, pero es mejor no forzar bajas.
                  }
                }}
              ></textarea>

              {/* DRAG & DROP ZONE PARA PDF */}
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer relative overflow-hidden ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => document.getElementById('pdf-upload')?.click()}
              >
                <input 
                  type="file" 
                  id="pdf-upload" 
                  accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }} 
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center justify-center gap-2">
                    <UploadCloud className={`w-5 h-5 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      <span className="font-bold text-blue-600 dark:text-blue-400">Opcional:</span> Arrastra un PDF, Word o Excel aquí para extraer el texto (se integran automáticamente las primeras 100 palabras). 
                    </p>
                  </div>
                  <span className="block text-xs font-normal text-gray-500 mt-1 px-4">
                    🔒 100% Privado: Los archivos se procesan directamente en tu navegador. Tus datos nunca salen de tu propia computadora ni se suben a la red.
                  </span>
                </div>
              </div>
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
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 transition-colors shadow-sm">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{taskDetails.entregable || taskDetails.tipo}</h4>
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{taskDetails.descripcion}</p>
            </div>
            
            {taskDetails.docenteVinculado && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-3 inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                👥 Personas vinculadas: {taskDetails.docenteVinculado}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Módulo de Reuniones y Derivación (Curso 4):</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    const template = `📋 **MINUTA DE REUNIÓN / AVANCE**
• Tipo de Tarea * ${taskDetails.tipo || ''}

Prioridad * ${taskDetails.prioridad || ''} - Fecha de Inicio * ${taskDetails.fechaInicio || ''}

Fecha de Vencimiento * ${taskDetails.fechaVencimiento || ''}
Descripción / Detalle de la Tarea * ${taskDetails.descripcion || ''}
Resultado Esperado / Entregable * ${taskDetails.entregable || ''}
Estado * ${taskDetails.estado || 'Pendiente'}

Fecha de Cumplimiento: ${taskDetails.fechaCumplimiento || 'dd/mm/aaaa'}
Enlace de Evidencia (Opcional): ${taskDetails.evidencia || ''}`;
                    navigator.clipboard.writeText(template);
                    toast.success('¡Plantilla de Minuta copiada! Pégala en donde consideres que se debe enviar esta información (email, whatsapp o documento específico).');
                  }}
                  className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-1.5 px-3 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 flex items-center gap-1"
                >
                  📋 Copiar Minuta
                </button>
              </div>

              {/* Botones dinámicos de envío a responsables */}
              {(() => {
                const names = taskDetails.docenteVinculado ? taskDetails.docenteVinculado.split(',').map((n: string) => n.trim()) : [];
                const linkedContacts = docentes.filter(d => names.includes(d.nombre));
                
                if (linkedContacts.length === 0) return null;

                return (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Notificar Acuerdos a:</p>
                    {linkedContacts.map((contact, idx) => {
                      const msgText = `Hola ${contact.nombre}, te escribo para registrar los acuerdos y próximos pasos del tema: *${taskDetails.tipo}*.\n\n• *Objetivo:* ${taskDetails.entregable}\n• *Vencimiento:* ${taskDetails.fechaVencimiento}\n\nPor favor, avisame ante cualquier duda para destrabar el proceso. ¡Saludos!`;
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg gap-2">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">{contact.nombre}</span>
                          <div className="flex gap-2">
                            {contact.telefono && (
                              <a 
                                href={`https://wa.me/${contact.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(msgText)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded-md transition-colors"
                              >
                                <MessageCircle className="w-3 h-3" /> Enviar Acuerdo
                              </a>
                            )}
                            {contact.email && (
                              <a 
                                href={`mailto:${contact.email}?subject=${encodeURIComponent(`Acuerdos de Reunión: ${taskDetails.tipo}`)}&body=${encodeURIComponent(msgText)}`}
                                className="flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded-md transition-colors"
                              >
                                <Mail className="w-3 h-3" /> Enviar Correo
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
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

        <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3 border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
          {isUpdating ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors border border-red-200 dark:border-red-800 flex items-center justify-center sm:justify-start"
            >
              Eliminar Tarea
            </button>
          ) : <div className="hidden sm:block"></div>}
          
          <div className="flex flex-col sm:flex-row gap-3">
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
        </div>
      </form>

      {isUpdating && selectedTaskId && (
        <CommentsSection taskId={selectedTaskId} />
      )}
    </div>
  );
}
