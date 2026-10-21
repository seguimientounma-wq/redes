'use client';

import React, { useState } from 'react';
import {
  Network, BookOpen, Layers, CheckCircle2, AlertTriangle,
  Sparkles, ChevronRight, ChevronDown, Info, ShieldCheck,
  Smartphone, UserCheck, Bot, FileText, ArrowRight,
  GraduationCap, HelpCircle, Eye, Users, AlertCircle, Compass,
  Palette, Cpu, Search, Terminal, Lock, Gamepad2, Video,
  Headphones, PlaySquare, Award, Wand2
} from 'lucide-react';

export default function EveaMindMapTab() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('que-es-evea');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedMobileNodes, setExpandedMobileNodes] = useState<Record<string, boolean>>({
    'que-es-evea': true
  });

  const toggleMobileNode = (id: string) => {
    setExpandedMobileNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    setSelectedNodeId(id);
  };

  // Nodos oficiales: Cultura EVEA, Interactividad H5P y Marco de Transparencia de la IA de la UNMa
  const mindMapNodes = [
    {
      id: 'que-es-evea',
      category: 'fundamentos',
      title: '¿Qué es realmente el EVEA?',
      subtitle: 'Entorno Vivo vs Repositorio Estático',
      tag: 'Posicionamiento Institucional',
      color: 'from-blue-600 to-indigo-700',
      textColor: 'text-blue-500',
      borderColor: 'border-blue-500',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
      queEs: 'EVEA son las siglas de "Entorno Virtual de Enseñanza y Aprendizaje". En la UNMa, no es una biblioteca de PDFs ni un casillero burocrático de entregas. Es el espacio institucional digital donde se recrea la clase universitaria mediante interacción dialógica, mediación pedagógica situada y retroalimentación formativa.',
      paraQueSirve: 'Constituye nuestro posicionamiento institucional para garantizar una educación superior a distancia de máxima calidad académica, socialmente comprometida y formadora de pensamiento crítico.',
      puntosClave: [
        'Formación pedagógica llevada a la práctica por ELENA PATZER para el equipo NoDocente, Educación a Distancia y Docentes.',
        'Posicionamiento Institucional: En la UNMa no concebimos la educación a distancia como autoaprendizaje solitario; la presencia docente, el diálogo y la retroalimentación son irrenunciables.',
        'La Entrega es solo una Parte: Un aula no se define por "dónde se sube la tarea o los video de la clase por zoom", sino por la secuencia didáctica previa que la fundamenta y el acompañamiento posterior.',
        'Diseño Mobile-First (70%+ en celulares): Toda la información clave debe leerse en pantalla sin forzar descargas pesadas de PDFs que consuman datos del estudiante.',
        'Principio de Trazabilidad Total: Lo que se planifica en la Sala Docente se reconoce pedagógicamente en el Aula; lo que se produce en el Aula retroalimenta la planificación.'
      ],
      alertaInstitucional: '⚠️ Error común: Tratar al aula virtual como un repositorio de contenidos, PDFs o entregas. La entrega es solo una parte; lo esencial es la consigna orientadora, el debate y la rúbrica formativa, la mediación pedagógica y la guía didáctica.',
      normativa: 'Marco Institucional EVEA UNMa • Res. 2599/2023 SIED • Formación Pedagógica Elena Patzer'
    },
    {
      id: 'interactividad-h5p',
      category: 'interactividad',
      title: 'Interactividad, H5P y Recursos Lúdicos Multimediales',
      subtitle: 'El Aula Viva: Dinamización Pedagógica del Aprendizaje',
      tag: 'Innovación Pedagógica EVEA',
      color: 'from-emerald-500 via-teal-600 to-cyan-700',
      textColor: 'text-emerald-500',
      borderColor: 'border-emerald-500',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
      queEs: 'La incorporación sistemática de recursos lúdicos e interactivos en Moodle/EVEA para enriquecer la experiencia de cursada: módulos H5P, videos interactivos con paradas reflexivas, podcasts, simulaciones de casos jurídicos y desafíos gamificados.',
      paraQueSirve: 'Transforma al estudiante de espectador pasivo de PDFs en protagonista activo: promueve la autoevaluación inmediata, mantiene alta la motivación, refuerza la memoria de trabajo y permite experimentar dilemas ético-jurídicos en entornos controlados y atractivos.',
      puntosClave: [
        'Módulos H5P en Moodle: Cuestionarios interactivos incrustados, tarjetas de memoria conceptual (Flashcards), líneas de tiempo dinámicas de fallos y textos con rellenado guiado.',
        'Video y Audio Interactivo: Píldoras audiovisuales docentes con preguntas intermedias obligatorias (H5P Interactive Video) y podcasts introductorios descargables para escuchar en viaje.',
        'Actividades Lúdicas y Gamificación: Casos jurídicos ramificados tipo "elige tu propia estrategia legal", trivias de autodiagnóstico previo y medallas de logro formativo.',
        'Criterio Pedagógico Clave: La interactividad y lo lúdico nunca son mero adorno visual; siempre responden a un objetivo de aprendizaje claro, orientado por la guía didáctica docente.'
      ],
      alertaInstitucional: '🎮 Regla de Oro: Lo interactivo no sustituye la lectura profunda ni la fundamentación teórica; opera como un puente pedagógico que entusiasma, contextualiza y fija conceptos complejos.',
      normativa: 'Punto 2 y 4 EVEA: Criterios de Interactividad y Calidad Didáctica'
    },
    {
      id: 'cinco-bloques',
      category: 'aula',
      title: 'La Clase Institucional en 5 Bloques',
      subtitle: 'Estructura Didáctica Común para Todas las Asignaturas',
      tag: 'Estandarización de Aulas',
      color: 'from-sky-500 to-blue-600',
      textColor: 'text-sky-500',
      borderColor: 'border-sky-500',
      badgeBg: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300',
      queEs: 'La secuencia pedagógica obligatoria que organiza cada clase virtual en la carrera de Abogacía de la UNMa.',
      paraQueSirve: 'Brinda previsibilidad y autonomía al estudiante, facilitando su hábito de estudio y asegurando una experiencia homogénea a lo largo de toda la carrera.',
      puntosClave: [
        'Bloque 1 · Apertura y Orientación: Propósito formativo, pregunta problematizadora y Nivel de IA habilitado (0 a 3).',
        'Bloque 2 · Desarrollo y Recursos: Presentación docente, "Guía de Aprendizaje" (denominación oficial que erradica el término "cuadernillo"), jurisprudencia, cápsulas multimedia y lecturas obligatorias.',
        'Bloque 3 · Interacción Académica: Foro de intercambio y debate argumentado moderado por el docente, enriquecido con disparadores lúdicos o casos dilemáticos (el foro de dudas técnicas va aparte).',
        'Bloque 4 · Actividades y Evidencias: Consigna explícita, producto esperado, rúbrica previa y espacio único de entrega que distingue en término/tardía.',
        'Bloque 5 · Cierre y Continuidad: Síntesis conceptual, autoevaluación interactiva tipo H5P y anticipación del próximo tema.'
      ],
      alertaInstitucional: '🚫 Erradicación terminológica: No llamar "cuadernillo" al material digital. Usar siempre "Guía de Aprendizaje" institucional.',
      normativa: 'Punto 4.2 Arquitectura del Aula UNMa'
    },
    {
      id: 'dos-caras',
      category: 'fundamentos',
      title: 'Ecosistema Articulado: Aula + Sala Docente',
      subtitle: 'La Experiencia del Alumno y la Trastienda Cátedra',
      tag: 'Arquitectura UNMa',
      color: 'from-indigo-600 to-violet-700',
      textColor: 'text-indigo-500',
      borderColor: 'border-indigo-500',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
      queEs: 'La división funcional del campus en dos ámbitos complementarios: el Aula de la Asignatura (visible para estudiantes) y la Sala Docente (restringida a la cátedra y autoridades).',
      paraQueSirve: 'Mantiene el aula del estudiante limpia y orientadora, sin trasladarle la complejidad burocrática, mientras le da al equipo docente un panel de control para ajustar su enseñanza en tiempo real.',
      puntosClave: [
        'Aula de la Asignatura: Portada con bienvenida, programa, cronograma con fechas claras y clases semanales ordenadas.',
        'Sala Docente: Aloja el Plan de Trabajo Didáctico (PTD), la Matriz de Evidencias, el repositorio de rúbricas y el panel de seguimiento de alertas.',
        'Cadena de Trazabilidad Pedagógica: Programa ➔ PTD ➔ Clase ➔ Actividad ➔ Evidencia ➔ Rúbrica ➔ Retroalimentación.',
        'Ajuste de la Enseñanza: La Sala Docente registra los patrones de error detectados para reformular las clases siguientes.'
      ],
      alertaInstitucional: '💡 Cultura Institucional: Toda actividad relevante debe poder asociarse con un resultado de aprendizaje esperado y con una rúbrica transparente previa a la entrega.',
      normativa: 'Puntos 3, 5 y 6 Documento de Trabajo EVEA'
    },
    {
      id: 'marco-ia-principios',
      category: 'ia',
      title: 'Marco de Transparencia de la IA: Principios Rectores',
      subtitle: 'Inteligencia Aumentada y Centralidad Humana',
      tag: 'Marco Ético UNMa',
      color: 'from-purple-600 to-pink-600',
      textColor: 'text-purple-500',
      borderColor: 'border-purple-500',
      badgeBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
      queEs: 'La postura epistemológica y ética de la UNMa frente a los modelos generativos y sistemas agénticos: la IA procesa cálculos probabilísticos sin conciencia, voluntad, empatía ni discernimiento ético, por lo que NO puede ser autora de ninguna producción académica.',
      paraQueSirve: 'Evita la sustitución de las funciones cognitivas esenciales (atención, memoria, argumentación, juicio crítico) y asegura que la tecnología opere como un andamiaje que amplíe las capacidades humanas bajo responsabilidad indelegable.',
      puntosClave: [
        'Principio de Centralidad Humana: Toda producción asistida por IA debe ser contrastada con fuentes rigurosas. La autoría es 100% humana.',
        'Inadmisibilidad de Acreditación Automatizada: La enseñanza, la supervisión y la evaluación permanecen siempre bajo juicio y responsabilidad humana.',
        'Pensamiento Algorítmico Crítico: Entender las limitaciones técnicas de los modelos de lenguaje para identificar sesgos y alucinaciones (datos o fallos falsos que la IA inventa con apariencia de certeza).',
        'Soberanía Tecnológica y Datos (Ley 25.326): Prohibición estricta de subir datos personales, sensibles o confidenciales a plataformas de IA externas.'
      ],
      alertaInstitucional: '⚖️ Postura UNMa: No se admite la delegación no supervisada de procesos cognitivos o de investigación en agentes autónomos.',
      normativa: 'Marco Referencial de IA UNMa (Sección I a IV)'
    },
    {
      id: 'ia-escala-niveles',
      category: 'ia',
      title: 'Escala de Integración de IA: Niveles 0 a 3',
      subtitle: 'Claridad en Consignas y Responsabilidad Intelectual',
      tag: 'Graduación Pedagógica',
      color: 'from-fuchsia-600 to-rose-600',
      textColor: 'text-fuchsia-500',
      borderColor: 'border-fuchsia-500',
      badgeBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300',
      queEs: 'La escala institucional de 4 niveles que cada docente debe explicitar obligatoriamente en el programa y en la consigna de cada actividad para que el estudiante sepa qué nivel de asistencia técnica está admitido.',
      paraQueSirve: 'Otorga previsibilidad pedagógica: el estudiante sabe con exactitud cómo puede interactuar con la IA y qué registros de transparencia debe presentar.',
      puntosClave: [
        'Nivel 0 (Uso No Habilitado / Producción Autónoma): Trabajo individual o grupal 100% analógico/sin IA para valorar el razonamiento conceptual y la fundamentación propia.',
        'Nivel 1 (Uso Asistido Formal y Estilístico): Habilitada para corrección ortotipográfica, revisión gramatical u organización formal. No requiere informe exhaustivo de trazabilidad.',
        'Nivel 2 (Uso Integrado y Mediación Dialógica): La IA se usa como contraparte reflexiva (lluvia de ideas, hipótesis, esquemas). Requiere declaración y registro de trazabilidad MTD-IA.',
        'Nivel 3 (Cocreación y Auditoría Algorítmica): Interacción central con modelos para comparar respuestas, detectar sesgos o auditar razonamientos. Exige informe MTD-IA y análisis crítico exhaustivo.'
      ],
      alertaInstitucional: '📌 Principio de Responsabilidad Académica: La autorización de cualquiera de estos niveles jamás diluye la responsabilidad del estudiante. Quien firma el trabajo responde por el rigor conceptual y las conclusiones.',
      normativa: 'Escala Institucional de Integración Curricular de la IA UNMa'
    },
    {
      id: 'ia-dispositivos-trazabilidad',
      category: 'ia',
      title: 'Dispositivos de Transparencia: MTD-IA, 3C y Modelo Cromático',
      subtitle: 'Herramientas de Trazabilidad y Validación Genuina',
      tag: 'Dispositivos de Validación',
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-500',
      borderColor: 'border-amber-500',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
      queEs: 'El conjunto de instrumentos concretos que hacen visible el proceso de trabajo del estudiante y validan su autoría sin recurrir a detectores automáticos falibles.',
      paraQueSirve: 'Permite evaluar no solo el producto final, sino el proceso de aprendizaje, la honestidad intelectual y la capacidad de cotejo de fuentes de los estudiantes.',
      puntosClave: [
        'Módulo de Trazabilidad y Declaración (MTD-IA): Bitácora donde el estudiante registra el entorno técnico, los prompts usados, qué respuestas descartó o reformuló y el cotejo manual 3C.',
        'Estándar 3C: Verificación obligatoria de Coherencia argumental, Consistencia conceptual y Contrastación de fuentes reales para eliminar alucinaciones.',
        'Modelo Cromático de Escritura (Ensayos/Monografías): Texto en Negro (producción humana autónoma), Texto en Verde (co-creación y asistencia dialéctica depurada), y Texto/Marcas en Rojo (citas de fuentes primarias verificadas y material sintético).',
        'Microdefensa Oral (3 a 5 min): Instancia dialógica individual con preguntas de Fundamentación («¿Por qué tomó esta decisión?»), Transferencia («¿Cómo cambiaría el análisis en otro contexto?») y Contraste («¿Qué objeción formularía una postura divergente?»).'
      ],
      alertaInstitucional: '🚫 Inadmisibilidad de Detectores: Queda terminantemente prohibido sancionar o juzgar a un estudiante basándose en detectores automáticos de IA (Turnitin, GPTZero). Ante dudas de autoría, la garantía institucional es siempre la entrevista oral directa.',
      normativa: 'Dispositivos Institucionales de Trazabilidad y Evaluación con IA UNMa'
    },
    {
      id: 'encierro-inclusion',
      category: 'acompanamiento',
      title: 'Dispositivos de Inclusión: EVEA y Contextos de Encierro',
      subtitle: 'Garantía de Derechos y Equiparación Pedagógica',
      tag: 'Inclusión Territorial',
      color: 'from-teal-600 to-emerald-800',
      textColor: 'text-teal-500',
      borderColor: 'border-teal-500',
      badgeBg: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
      queEs: 'El abordaje pedagógico que garantiza el derecho a la educación universitaria tanto en el entorno digital como en contextos de privación de la libertad.',
      paraQueSirve: 'Asegura igualdad de oportunidades para que las condiciones de acceso tecnológico no condicionen las trayectorias formativas.',
      puntosClave: [
        'En el EVEA Digital: Foros de consulta moderados con simuladores socráticos y encuentros sincrónicos en Zoom.',
        'En Contextos de Encierro: La propuesta se traslada a soporte impreso mediante Cuadernillos Didácticos con simulación offline del Estándar 3C frente a respuestas de IA.',
        'Cuadernillo Volante de Intercambio: Circula con devoluciones docentes personalizadas y registro analógico del proceso de co-construcción (MTD-IA) en el circuito penitenciario.',
        'Equiparación de Calidad: Los estudiantes en contextos de encierro adquieren las mismas capacidades analíticas y críticas que quienes cursan en el campus virtual.'
      ],
      alertaInstitucional: '🤝 Compromiso UNMa: La tecnología es un puente de inteligencia aumentada, pero la inclusión y la presencia pedagógica son el corazón del proyecto universitario.',
      normativa: 'Dispositivos Institucionales de Cursada UNMa'
    }
  ];

  const currentNode = mindMapNodes.find(n => n.id === selectedNodeId) || mindMapNodes[0];

  const filteredNodes = mindMapNodes.filter(n =>
    activeCategory === 'all' ? true : n.category === activeCategory
  );

  return (
    <div className="space-y-6">
      {/* Banner Principal de Cultura Institucional */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4 text-cyan-400" /> Posicionamiento Institucional Oficial • UNMa
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Cultura Institucional de Educación a Distancia (EVEA & IA)
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Formación pedagógica llevada a la práctica por <strong>ELENA PATZER</strong> para el equipo <strong>NoDocente</strong>, <strong>Educación a Distancia</strong> y <strong>Docentes</strong>. Comprende la arquitectura del EVEA, la interactividad lúdica en Moodle (H5P, videos, podcasts) y el <strong>Marco Referencial para el uso ético, pedagógico y transparente de la Inteligencia Artificial</strong> de la Universidad Nacional Madres de Plaza de Mayo.
          </p>
        </div>

        {/* Filtros de Ejes Temáticos */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">Ejes Temáticos:</span>
          {[
            { id: 'all', label: 'Todos los Ejes (8)' },
            { id: 'fundamentos', label: '1. Fundamentos & Arquitectura' },
            { id: 'interactividad', label: '🎮 2. Interactividad & H5P Lúdico' },
            { id: 'aula', label: '3. Clases en 5 Bloques' },
            { id: 'ia', label: '4. Marco de Transparencia IA (Niveles 0-3, 3C, MTD)' },
            { id: 'acompanamiento', label: '5. Inclusión & Encierro' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveCategory(f.id)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all ${activeCategory === f.id
                  ? 'bg-white text-slate-900 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido: Acordeón desplegable en móviles (< lg) y Vista dividida en desktop (>= lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Nodos Interactivos (con acordeón en móvil) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" /> Nodos de Conocimiento
            </h3>
            <span className="text-[11px] text-gray-400 hidden lg:inline">Selecciona para estudiar</span>
            <span className="text-[11px] text-gray-400 lg:hidden">Toca para desplegar</span>
          </div>

          <div className="space-y-3">
            {filteredNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isExpandedMobile = !!expandedMobileNodes[node.id];

              return (
                <div
                  key={node.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${isSelected
                      ? `bg-white dark:bg-gray-800 border-2 ${node.borderColor} shadow-lg`
                      : 'bg-white/80 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700/80 hover:shadow'
                    }`}
                >
                  {/* Encabezado del Nodo (clicable) */}
                  <div
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      toggleMobileNode(node.id);
                    }}
                    className="p-4 cursor-pointer flex items-center justify-between gap-3 select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${node.color} text-white shadow-sm shrink-0`}>
                        {node.id === 'interactividad-h5p' ? <Gamepad2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${node.badgeBg}`}>
                            {node.tag}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate mt-0.5">
                          {node.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {node.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Icono en Desktop */}
                      <ChevronRight className={`hidden lg:block w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:translate-x-1'}`} />

                      {/* Icono Desplegable en Móvil */}
                      <div className="lg:hidden p-1 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
                        {isExpandedMobile ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* DESPLEGABLE EN CELULAR (Solo visible en < lg si está expandido) */}
                  {isExpandedMobile && (
                    <div className="lg:hidden p-4 pt-2 border-t border-gray-100 dark:border-gray-700/70 bg-gray-50/50 dark:bg-gray-900/40 space-y-3.5 animate-in fade-in-50 duration-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                          {node.normativa}
                        </span>
                      </div>

                      {/* ¿Qué significa? */}
                      <div>
                        <h5 className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <HelpCircle className="w-3.5 h-3.5" /> ¿Qué significa en la UNMa?
                        </h5>
                        <p className="text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700 leading-relaxed">
                          {node.queEs}
                        </p>
                      </div>

                      {/* Propósito */}
                      <div>
                        <h5 className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <Compass className="w-3.5 h-3.5" /> Propósito Formativo y Posicionamiento
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700 leading-relaxed">
                          {node.paraQueSirve}
                        </p>
                      </div>

                      {/* Criterios Obligatorios */}
                      <div>
                        <h5 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Criterios Clave:
                        </h5>
                        <div className="space-y-1.5">
                          {node.puntosClave.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Alerta Institucional */}
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-semibold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>{node.alertaInstitucional}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha (Desktop >= lg): Panel de Estudio Fijo y Exhaustivo */}
        <div className="hidden lg:block lg:col-span-7 sticky top-6 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 sm:p-7 shadow-xl relative overflow-hidden">
            {/* Banda superior de color */}
            <div className={`h-2.5 w-full bg-gradient-to-r ${currentNode.color} absolute top-0 left-0`} />

            {/* Cabecera del concepto */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-4">
              <div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${currentNode.badgeBg} inline-block mb-1`}>
                  {currentNode.tag}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                  {currentNode.title}
                </h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {currentNode.subtitle}
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-gray-400 dark:text-gray-500 shrink-0 self-start sm:self-auto bg-gray-50 dark:bg-gray-900/60 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700">
                {currentNode.normativa}
              </span>
            </div>

            {/* Sección: ¿Qué es? */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> ¿Qué significa en la UNMa?
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 leading-relaxed bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                {currentNode.queEs}
              </p>
            </div>

            {/* Sección: ¿Para qué sirve? */}
            <div className="mt-4 space-y-1.5">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> Propósito Formativo y Posicionamiento Institucional
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                {currentNode.paraQueSirve}
              </p>
            </div>

            {/* Sección: Puntos Clave Institucionales */}
            <div className="mt-5 space-y-2.5">
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Criterios Obligatorios a Recordar:
              </h4>
              <div className="space-y-2">
                {currentNode.puntosClave.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerta Institucional / Error Común a Evitar */}
            <div className="mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm leading-relaxed font-semibold flex items-start gap-2.5 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>{currentNode.alertaInstitucional}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
