import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';

import { getStatusLabel, getDiffDays } from '@/lib/taskStatus';

export function useSmartFilter(initialTasks: any[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  // El manejo de eventos 'cira-apply-filter' se realiza centralizadamente en DashboardTabs.tsx 
  // para poder coordinar correctamente searchTerm, statusFilter y activeFilters sin pisarse.

  const toggleListening = () => {
    if (isListening) return; // Si ya escucha, no iniciar otro
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta búsqueda por voz.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  useEffect(() => {
    let result = initialTasks || [];

    if (searchTerm.trim() !== '') {
      // Función para quitar acentos y pasar a minúsculas
      const normalize = (str: any) => (str || '').toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      // 1. Preparar las tareas con "searchTags" y campos normalizados sin acentos
      const tasksWithTags = result.map(task => {
        const estadoLower = getStatusLabel(task).toLowerCase();
        let tags = `${estadoLower} `;
        
        // Diccionario Semántico de Estados
        if (estadoLower === 'cumplida') tags += "completada terminada finalizada lista hecha ";
        if (estadoLower === 'pendiente') tags += "incompleta falta abierta sin hacer ";
        if (estadoLower === 'vencida') tags += "atrasada expirada urgente roja demora demorada pasada ";
        if (estadoLower === 'en proceso') tags += "haciendo curso trabajando activa ";
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const parseToYMD = (str: string) => {
          if (!str) return null;
          const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          const matchIso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (matchIso) return `${matchIso[1]}-${matchIso[2].padStart(2, '0')}-${matchIso[3].padStart(2, '0')}`;
          return null;
        };

        const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Tags si fue creada o asignada hoy
        const createdYMD = parseToYMD(task.fechaCreacion || task.fechaAsignacion || task.timestamp);
        if (createdYMD === todayYMD) {
          tags += " hoy creada creada_hoy nuevas asignada_hoy ";
        }

        // Tags si fue cumplida hoy
        const cumplidaYMD = parseToYMD(task.fechaCumplimiento);
        if (cumplidaYMD === todayYMD) {
          tags += " hoy cumplida_hoy finalizada_hoy resuelta_hoy ";
        }

        if (task.fechaVencimiento) {
          const parts = task.fechaVencimiento.split('/');
          if (parts.length === 3) {
            const [d, m, y] = parts;
            const limitDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            const diffTime = limitDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Períodos relativos
            if (diffDays === 0) tags += " hoy vence_hoy vencimiento_hoy";
            else if (diffDays === 1) tags += " mañana manana";
            else if (diffDays > 1 && diffDays <= 7) tags += " esta semana";
            else if (diffDays > 7 && diffDays <= 14) tags += " proxima semana";
            else if (diffDays > 14 && diffDays <= 31) tags += " este mes";
            else if (diffDays > 31 && diffDays <= 62) tags += " proximo mes";
            
            // Días exactos (para consultas como "vencen en 3 dias" o "hace 5 dias")
            if (diffDays < 0) tags += ` hace ${Math.abs(diffDays)} dias dias atrasada expirada`;
            if (diffDays > 0) tags += ` en ${diffDays} dias dias`;
            tags += ` ${Math.abs(diffDays)} dias dias`;
          }
        }
        return { 
          ...task, 
          searchTags: tags,
          normDocente: normalize(task.docenteVinculado),
          normTipo: normalize(task.tipo),
          normAsignado: normalize(task.nombreAsignado) + " " + normalize(task.apellidoAsignado),
          normDescripcion: normalize(task.descripcion),
          normEntregable: normalize(task.entregable),
          normArea: normalize(task.area),
          normCargo: normalize(task.cargo)
        };
      });

      // 2. Limpiar stopwords y normalizar (quitar acentos) el término de búsqueda
      // Se agregan verbos comunes y pronombres para que la NLP se centre en las palabras clave reales.
      const stopwords = ['de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'en', 'para', 'por', 'que', 'con', 'y', 'o', 'tareas', 'quiero', 'ver', 'buscar', 'mostrar', 'muestrame', 'cuales', 'quien', 'quienes', 'tienen', 'tiene', 'estan', 'esta'];
      const cleanSearchTerm = normalize(searchTerm)
        .split(' ')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0 && !stopwords.includes(t))
        .join(' ');

      // 3. Ejecutar Fuse.js (Fuzzy Matching Intersectado por Palabras)
      if (cleanSearchTerm.length > 0) {
        const words = cleanSearchTerm.split(' ');
        result = tasksWithTags; // IMPORTANTE: Iniciar la búsqueda con las tareas mapeadas
        
        // Buscamos cada palabra individualmente (AND lógico)
        words.forEach((word: string) => {
          // 1. Intentar coincidencia exacta primero usando campos SIN ACENTOS
          let exactMatches = result.filter(task => {
            const searchableString = `
              ${task.normTipo || ''} 
              ${task.normDescripcion || ''} 
              ${task.normEntregable || ''} 
              ${task.normArea || ''} 
              ${task.normCargo || ''} 
              ${task.searchTags || ''} 
              ${task.estado || ''} 
              ${task.normAsignado || ''} 
              ${task.normDocente || ''} 
            `;
            return searchableString.includes(word);
          });

          if (exactMatches.length > 0) {
            result = exactMatches;
          } else {
            // 2. Si no hay coincidencia exacta, usamos Fuse.js sobre los campos sin acentos
            // PESOS AJUSTADOS: Apellidos y Cargos tienen muchísima prioridad
            const fuse = new Fuse(result, {
              keys: [
                { name: 'normAsignado', weight: 6 },
                { name: 'normDocente', weight: 5 },
                { name: 'searchTags', weight: 4 },
                { name: 'normTipo', weight: 3 },
                { name: 'normCargo', weight: 2 },
                { name: 'normArea', weight: 2 },
                { name: 'estado', weight: 2 },
                { name: 'normDescripcion', weight: 1 },
                { name: 'normEntregable', weight: 1 }
              ],
              threshold: 0.4, // Mayor flexibilidad para apellidos largos
              ignoreLocation: true,
              distance: 1000
            });
            
            result = fuse.search(word).map((res: any) => res.item);
          }
        });
      }
    }

    // Filtros estáticos
    result = result.filter(task => {
      const matchesStatus = statusFilter === 'Todas' ? true : getStatusLabel(task) === statusFilter;
      return matchesStatus;
    });

    setFilteredTasks(result);
  }, [initialTasks, searchTerm, statusFilter]);

  return {
    searchTerm,
    setSearchTerm,
    isListening,
    toggleListening,
    statusFilter,
    setStatusFilter,
    filteredTasks
  };
}
