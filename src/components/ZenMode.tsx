import React, { useState, useEffect } from 'react';
import { X, Play, Pause, CheckCircle2, Target, Quote } from 'lucide-react';

// Base de datos local de citas recopiladas (Scraping simulado de alta calidad y latencia cero)
const INSPIRATIONAL_QUOTES = [
  "«La única lucha que se pierde es la que se abandona.» – Madres de Plaza de Mayo",
  "«La memoria no es para llorar, es para saber de dónde venimos y adónde vamos.» – Abuelas de Plaza de Mayo",
  "«Privar a las personas de sus derechos humanos es poner en tela de juicio su propia humanidad.» – Nelson Mandela",
  "«La paz no es solamente la ausencia de la guerra; mientras haya exclusión, difícilmente podremos alcanzar un mundo de paz.» – Rigoberta Menchú",
  "«No basta con hablar de paz. Uno debe creer en ella. Y no basta con creer. Hay que trabajar para conseguirla.» – Eleanor Roosevelt",
  "«Un derecho no es algo que alguien te da; es algo que nadie te puede quitar.» – Ramsey Clark",
  "«El perdón es una necesidad absoluta para la continuación de la existencia humana.» – Desmond Tutu",
  "«Toda la oscuridad en el mundo no puede apagar la luz de una sola vela.» – San Francisco de Asís",
  "«Los derechos humanos son sus derechos. Tómenlos. Defiéndanlos. Promuévanlos. Entiéndanlos e insistan en ellos.» – Kofi Annan",
  "«Siembra en los niños ideas buenas, aunque no las entiendan; los años se encargarán de descifrarlas.» – María Montessori"
];

// Estaciones con múltiples videos para rotación aleatoria (Solo IDs con inserción permitida verificada)
const MUSIC_STATIONS = [
  { id: 'lofi', name: 'Lofi Vibes', videos: ['_tV5LEBDs7w', '5qap5aO4i9A', 'jfKfPfyJRdk'], icon: '☕' },
  { id: 'zen', name: 'Meditación', videos: ['lFcSrYw-ARY', 'WPni755-Krg', 'FjHGZj2IjBk', 'S_CGed6E610'], icon: '🧘' },
  { id: 'lluvia', name: 'Lluvia y Foco', videos: ['mPZkdNFkNps', 'q76bMs-NwRk', 'nDq6TstdEi8'], icon: '🌧️' }
];

export default function ZenMode({ tasks, onClose, onComplete }: { tasks: any[], onClose: () => void, onComplete: (taskId: string) => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [currentQuote, setCurrentQuote] = useState(INSPIRATIONAL_QUOTES[0]);

  // Manejo de estaciones y videos aleatorios
  const [currentStation, setCurrentStation] = useState(MUSIC_STATIONS[0]);
  const [currentVideoId, setCurrentVideoId] = useState(MUSIC_STATIONS[0].videos[0]);

  const changeStation = (station: typeof MUSIC_STATIONS[0]) => {
    setCurrentStation(station);
    // Elegir video aleatorio dentro de la estación
    const randomVideo = station.videos[Math.floor(Math.random() * station.videos.length)];
    setCurrentVideoId(randomVideo);
  };

  useEffect(() => {
    // Al abrir, elegir un video aleatorio de la primera estación
    changeStation(MUSIC_STATIONS[0]);
    
    // Elegir cita aleatoria
    setCurrentQuote(INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)]);
  }, []);

  // Algoritmo Selector de Destino
  useEffect(() => {
    const activeTasks = tasks.filter(t => {
      const s = t.estado?.toLowerCase() || '';
      return !s.includes('cumplida') && !s.includes('cancelada');
    });

    if (activeTasks.length === 0) return;

    activeTasks.sort((a, b) => {
      const parseDate = (d: string) => {
        if (!d) return new Date(2100, 0, 1).getTime();
        if (d.includes('/')) {
           const parts = d.split('/');
           if (parts.length === 3) {
             const [day, month, year] = parts;
             return new Date(parseInt(year), parseInt(month)-1, parseInt(day)).getTime();
           }
        } else if (d.includes('-')) {
           const parts = d.split('-');
           if (parts.length === 3) {
             return new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2])).getTime();
           }
        }
        return new Date(2100, 0, 1).getTime();
      };
      return parseDate(a.fechaVencimiento) - parseDate(b.fechaVencimiento);
    });

    setSelectedTask(activeTasks[0]);
  }, [tasks]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500 overflow-y-auto">
      {/* Fondo decorativo oscuro */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-80 pointer-events-none"></div>

      {/* Botón Salir */}
      <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-white transition-colors z-10 bg-gray-800/50 p-2 rounded-full hover:bg-gray-700">
        <X className="w-8 h-8" />
      </button>

      <div className="max-w-5xl w-full flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch z-10 mb-8 mt-12 lg:mt-0">
        {/* Panel Izquierdo: Reloj y YouTube */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black/60 p-8 sm:p-10 rounded-[2rem] border border-gray-700 shadow-2xl backdrop-blur-md">
          <h3 className="text-gray-400 font-medium uppercase tracking-widest text-sm mb-4">Modo Concentración</h3>
          <div className="text-7xl sm:text-9xl font-mono text-green-400 tracking-tighter mb-8 drop-shadow-[0_0_20px_rgba(74,222,128,0.4)]">
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-4 mb-10">
            <button onClick={() => setIsActive(!isActive)} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center font-bold transition-all shadow-lg border border-white/5">
              {isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isActive ? 'Pausar' : 'Reanudar'}
            </button>
          </div>
          
          <div className="w-full max-w-[400px] aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50 bg-black">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=0&controls=1&modestbranding=1`} 
              title="Zen Music" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
          </div>
          
          <div className="flex gap-2 mt-4 w-full max-w-[400px]">
            {MUSIC_STATIONS.map(station => (
              <button
                key={station.id}
                onClick={() => changeStation(station)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 ${
                  currentStation.id === station.id 
                  ? 'bg-blue-600 text-white border border-blue-500' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-transparent'
                }`}
              >
                <span>{station.icon}</span>
                {station.name}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Derecho: La Tarea Seleccionada */}
        <div className="flex-1 w-full bg-gradient-to-br from-gray-800/80 to-gray-900/90 p-8 sm:p-10 rounded-[2rem] border border-gray-700 shadow-2xl backdrop-blur-md flex flex-col">
          <div className="flex items-center mb-6">
            <Target className="w-6 h-6 text-blue-400 mr-3" />
            <h2 className="text-xl text-gray-300 font-semibold uppercase tracking-wide">Tu Misión Principal</h2>
          </div>
          
          {selectedTask ? (
            <div className="flex flex-col flex-1">
              <div className="flex-1">
                <h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">{selectedTask.tipo}</h3>
                <p className="text-gray-300 text-lg leading-relaxed bg-black/20 p-5 rounded-2xl border border-white/5">{selectedTask.descripcion || 'Sin descripción detallada.'}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-black/40 p-4 rounded-xl border border-gray-700/50 flex flex-col justify-center">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Área / Sector</p>
                    <p className="text-gray-200 font-medium">{selectedTask.area || 'General'}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-gray-700/50 flex flex-col justify-center">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Responsable</p>
                    <p className="text-gray-200 font-medium">{selectedTask.nombreAsignado || 'Sin Asignar'}</p>
                  </div>
                </div>
                
                <div className="mt-4 bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-center justify-between">
                  <span className="text-red-400/80 text-sm uppercase tracking-wider font-semibold">Vencimiento Crítico</span>
                  <span className="text-red-400 font-bold text-lg">{selectedTask.fechaVencimiento || 'No definido'}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-700/50">
                 <button onClick={() => onComplete(selectedTask.id)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center group">
                   <CheckCircle2 className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                   Terminar o Actualizar esta Tarea
                 </button>
                 <p className="text-center text-gray-500 text-xs mt-4">Al presionar, irás directamente al formulario de esta tarea para registrar tu progreso.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-3xl text-white font-bold mb-2">¡Mente Despejada!</h3>
              <p className="text-gray-400 text-lg max-w-sm">No tienes tareas pendientes activas en tu radar actual. Estás completamente al día.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Cita de Esperanza / Derechos Humanos */}
      <div className="max-w-4xl w-full z-10 mt-auto px-6 py-6 bg-black/40 border border-gray-800 rounded-2xl flex items-center justify-center text-center">
        <Quote className="text-gray-600 w-8 h-8 mr-4 flex-shrink-0" />
        <p className="text-gray-300 italic text-lg tracking-wide font-serif">
          {currentQuote}
        </p>
      </div>

    </div>
  );
}
