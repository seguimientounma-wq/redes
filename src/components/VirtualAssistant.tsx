'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Bot, User, Send, ChevronRight } from 'lucide-react';
import Image from 'next/image';

type Message = {
  id: string;
  role: 'bot' | 'user';
  text: string | React.ReactNode;
};

export default function VirtualAssistant({ tasks }: { tasks: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: '¡Hola! Soy CIRA Anti-olvido 🤖. ¿En qué te ayudo hoy?'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Funciones de ayuda para calcular fechas
  const getDiffDays = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return null;
    const parts = fechaVencimiento.split('/');
    if (parts.length !== 3) return null;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const [d, m, y] = parts;
    const limitDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const diffTime = limitDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusLabel = (task: any) => {
    if (task.estado === 'Vencida') return 'Vencida';
    if (task.estado === 'Cumplida') return 'Cumplida';
    if (task.estado === 'Cancelada') return 'Cancelada';
    if (task.estado === 'En proceso') return 'En proceso';
    
    const diff = getDiffDays(task.fechaVencimiento);
    if (diff !== null && diff < 0) return 'Vencida';
    return task.estado || 'Pendiente';
  };

  const activeTasks = tasks.filter(t => getStatusLabel(t) !== 'Cumplida' && getStatusLabel(t) !== 'Cancelada');

  const handleAsk = (question: string) => {
    // Añadir mensaje del usuario
    const newMsg: Message = { id: Date.now().toString(), role: 'user', text: question };
    setMessages(prev => [...prev, newMsg]);

    // Calcular respuesta del bot simulando delay
    setTimeout(() => {
      let response: React.ReactNode = "Lo siento, no entendí esa pregunta.";

      const createFilterButton = (filterTerm: string, label: string) => (
        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent('cira-apply-filter', { detail: filterTerm }));
            setIsOpen(false);
          }}
          className="mt-3 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 dark:text-blue-300 py-1.5 px-3 rounded-lg transition-colors font-medium flex items-center gap-1 w-full justify-center"
        >
          Ver en Mis Tareas
        </button>
      );

      if (question === "¿Qué tareas vencen hoy?") {
        const dueToday = activeTasks.filter(t => getDiffDays(t.fechaVencimiento) === 0);
        if (dueToday.length === 0) {
          response = "¡Buenas noticias! No tienes ninguna tarea que venza el día de hoy. 🎉";
        } else {
          response = (
            <div>
              <p className="mb-2">Tienes <strong>{dueToday.length}</strong> tareas que vencen <strong>HOY</strong>:</p>
              <ul className="space-y-2 text-sm">
                {dueToday.map(t => (
                  <li key={t.id} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded border-l-2 border-amber-500">
                    <span className="font-semibold block truncate" title={t.tipo}>{t.tipo}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs truncate block">{t.docenteVinculado}</span>
                  </li>
                ))}
              </ul>
              {createFilterButton("hoy", "Ver tareas de HOY")}
            </div>
          );
        }
      } 
      else if (question === "¿Cuáles son las tareas urgentes de la semana?") {
        const dueWeek = activeTasks.filter(t => {
          const diff = getDiffDays(t.fechaVencimiento);
          return diff !== null && diff > 0 && diff <= 7;
        });
        if (dueWeek.length === 0) {
          response = "No tienes tareas urgentes para los próximos 7 días.";
        } else {
          response = (
            <div>
              <p className="mb-2">Hay <strong>{dueWeek.length}</strong> tareas que vencen en los próximos 7 días:</p>
              <ul className="space-y-2 text-sm max-h-[150px] overflow-y-auto">
                {dueWeek.map(t => (
                  <li key={t.id} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded border-l-2 border-blue-500">
                    <span className="font-semibold block truncate">{t.tipo}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs truncate block">Vence en {getDiffDays(t.fechaVencimiento)} días - {t.docenteVinculado}</span>
                  </li>
                ))}
              </ul>
              {createFilterButton("esta semana", "Ver urgentes de la SEMANA")}
            </div>
          );
        }
      }
      else if (question === "¿Qué tareas vencen mañana?") {
        const dueTmrw = activeTasks.filter(t => getDiffDays(t.fechaVencimiento) === 1);
        if (dueTmrw.length === 0) {
          response = "No tienes tareas que venzan mañana.";
        } else {
          response = (
            <div>
              <p className="mb-2">Hay <strong>{dueTmrw.length}</strong> tareas para MAÑANA:</p>
              <ul className="space-y-2 text-sm max-h-[150px] overflow-y-auto">
                {dueTmrw.map(t => (
                  <li key={t.id} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded border-l-2 border-yellow-500">
                    <span className="font-semibold block truncate">{t.tipo}</span>
                  </li>
                ))}
              </ul>
              {createFilterButton("mañana", "Ver tareas de MAÑANA")}
            </div>
          );
        }
      }
      else if (question === "¿Qué tareas tengo atrasadas?") {
        const overdue = tasks.filter(t => getStatusLabel(t) === 'Vencida');
        if (overdue.length === 0) {
          response = "¡Excelente trabajo! No tienes ninguna tarea atrasada registrada. 🌟";
        } else {
          response = (
            <div>
              <p className="mb-2 text-red-600 dark:text-red-400 font-semibold">🚨 Tienes {overdue.length} tareas ATRASADAS:</p>
              <ul className="space-y-2 text-sm">
                {overdue.slice(0, 5).map(t => (
                  <li key={t.id} className="bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-2 border-red-500">
                    <span className="font-semibold block truncate">{t.tipo}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs truncate block">Responsable: {t.docenteVinculado}</span>
                  </li>
                ))}
              </ul>
              {overdue.length > 5 && <p className="text-xs text-gray-500 mt-2 font-medium">Y {overdue.length - 5} más (Revisa la vista de Tarjetas).</p>}
              {createFilterButton("vencida", "Ver tareas ATRASADAS")}
            </div>
          );
        }
      }
      else if (question === "Mostrar tareas Cumplidas") {
        const done = tasks.filter(t => getStatusLabel(t) === 'Cumplida');
        response = (
          <div>
            <p>Hay {done.length} tareas marcadas como Cumplidas.</p>
            {createFilterButton("cumplida", "Ver tareas CUMPLIDAS")}
          </div>
        );
      }
      else if (question === "Mostrar tareas En Proceso") {
        const wip = tasks.filter(t => getStatusLabel(t) === 'En proceso');
        response = (
          <div>
            <p>Hay {wip.length} tareas actualmente En Proceso.</p>
            {createFilterButton("en proceso", "Ver tareas EN PROCESO")}
          </div>
        );
      }
      else if (question === "Quiero ver mis tareas (Filtrar por mi nombre)") {
        response = (
          <div>
            <p>Aún no has iniciado sesión. Para ver solo tus tareas, haz clic en el botón de abajo y escribe tu nombre en la barra de búsqueda principal.</p>
            {createFilterButton("", "Ir al Buscador")}
          </div>
        );
      }
      else if (question === "Generar reporte de estado general") {
        const total = tasks.length;
        const cumplidas = tasks.filter(t => getStatusLabel(t) === 'Cumplida').length;
        const vencidas = tasks.filter(t => getStatusLabel(t) === 'Vencida').length;
        const proceso = tasks.filter(t => getStatusLabel(t) === 'En proceso').length;
        const pendientes = tasks.filter(t => getStatusLabel(t) === 'Pendiente').length;

        response = (
          <div className="space-y-2 text-sm">
            <p className="font-semibold mb-2">📊 Reporte General Rápido:</p>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1"><span>Total Registradas:</span> <span className="font-bold">{total}</span></div>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1 text-green-600 dark:text-green-400"><span>✅ Cumplidas:</span> <span className="font-bold">{cumplidas}</span></div>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1 text-yellow-600 dark:text-yellow-400"><span>⏳ En Proceso:</span> <span className="font-bold">{proceso}</span></div>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1 text-blue-600 dark:text-blue-400"><span>📝 Pendientes:</span> <span className="font-bold">{pendientes}</span></div>
            <div className="flex justify-between text-red-600 dark:text-red-400"><span>🚨 Vencidas:</span> <span className="font-bold">{vencidas}</span></div>
          </div>
        );
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', text: response }]);
    }, 600);
  };

  const predefinedQuestions = [
    "¿Qué tareas vencen hoy?",
    "¿Qué tareas vencen mañana?",
    "¿Cuáles son las tareas urgentes de la semana?",
    "¿Qué tareas tengo atrasadas?",
    "Mostrar tareas En Proceso",
    "Mostrar tareas Cumplidas",
    "Quiero ver mis tareas (Filtrar por mi nombre)",
    "Generar reporte de estado general"
  ];

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl z-[90] transition-transform hover:scale-110 flex items-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
            <Image src="/cira-avatar.jpg" alt="CIRA Avatar" width={48} height={48} className="object-cover" />
          </div>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-medium">
            CIRA Anti-olvido
          </span>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-[90] border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white p-0.5 rounded-full shadow-sm overflow-hidden w-10 h-10 relative">
                <Image src="/cira-avatar.jpg" alt="CIRA Avatar" fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-sm">CIRA Anti-olvido</h3>
                <p className="text-xs text-blue-100">En línea</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50">
            {/* Presentación Grande Inicial */}
            <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl mb-3 relative">
                <Image src="/cira-avatar.jpg" alt="CIRA Avatar" fill className="object-cover" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">CIRA Anti-olvido</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[220px]">
                Tu asistente inteligente. Escribe o pregúntame lo que necesites.
              </p>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-sm rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias de Preguntas */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Preguntas rápidas ({predefinedQuestions.length}):</p>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-40 pr-1 custom-scrollbar">
              {predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(q)}
                  className="text-left w-full text-sm py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors flex justify-between items-center group"
                >
                  <span className="truncate pr-2">{q}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
