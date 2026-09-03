import { getTasks } from '@/actions/tasks';
import DashboardTabs from '@/components/DashboardTabs';
import VirtualAssistant from '@/components/VirtualAssistant';

export const metadata = {
  title: 'Dashboard - Seguimiento UNMa',
};

export default async function DashboardPage() {
  const tasks = await getTasks();

  return (
    <>
      <DashboardTabs initialTasks={tasks} />
      <VirtualAssistant tasks={tasks} />
    </>
  );
}
