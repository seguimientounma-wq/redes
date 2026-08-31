import { getTasks } from '@/actions/tasks';
import DashboardTabs from '@/components/DashboardTabs';

export const metadata = {
  title: 'Dashboard - Seguimiento UNMa',
};

export default async function DashboardPage() {
  const tasks = await getTasks();

  return (
    <DashboardTabs initialTasks={tasks} />
  );
}
