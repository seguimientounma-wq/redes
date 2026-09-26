import { getTasks } from '@/actions/tasks';
import DashboardTabs from '@/components/DashboardTabs';
import VirtualAssistant from '@/components/VirtualAssistant';

import { getSession } from '@/lib/session';

export const metadata = {
  title: 'Dashboard - Seguimiento UNMa',
};

export default async function DashboardPage() {
  const tasks = await getTasks();
  const session = await getSession();
  const userName = session?.user?.nombre || 'Usuario';

  return (
    <>
      <DashboardTabs initialTasks={tasks} />
      <VirtualAssistant tasks={tasks} userName={userName} />
    </>
  );
}
