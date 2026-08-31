'use client';

import { useState } from 'react';
import TaskListTab from './TaskListTab';
import TaskUpdateFormTab from './TaskUpdateFormTab';
import DashboardMetricsTab from './DashboardMetricsTab';

export default function DashboardTabs({ initialTasks }: { initialTasks: any[] }) {
  const [activeTab, setActiveTab] = useState<'list' | 'update' | 'metrics'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleUpdateClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveTab('update');
  };

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex space-x-1 bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl w-full sm:max-w-2xl mx-auto">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'list'
              ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          Mis Tareas & Alertas
        </button>
        <button
          onClick={() => {
            setSelectedTaskId(null);
            setActiveTab('update');
          }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'update'
              ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          Carga Diaria de Avance
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'metrics'
              ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          Métricas
        </button>
      </div>

      {/* Tabs Content */}
      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
        {activeTab === 'list' && (
          <TaskListTab tasks={initialTasks} onUpdateClick={handleUpdateClick} />
        )}
        {activeTab === 'update' && (
          <TaskUpdateFormTab 
            tasks={initialTasks} 
            selectedTaskId={selectedTaskId} 
            onSuccess={() => setActiveTab('list')}
          />
        )}
        {activeTab === 'metrics' && (
          <DashboardMetricsTab tasks={initialTasks} />
        )}
      </div>
    </div>
  );
}
