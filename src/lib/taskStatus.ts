export function getDiffDays(fechaVencimiento?: string): number | null {
  if (!fechaVencimiento) return null;
  const parts = fechaVencimiento.split('/');
  if (parts.length !== 3) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limitDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  if (isNaN(limitDate.getTime())) return null;
  const diffTime = limitDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusLabel(task: any): string {
  if (!task) return 'Pendiente';
  
  // Si explícitamente ya está cumplida o cancelada, se respeta ese estado terminal
  if (task.estado === 'Cumplida') return 'Cumplida';
  if (task.estado === 'Cancelada') return 'Cancelada';
  if (task.estado === 'Vencida') return 'Vencida';

  // Si tiene fecha de vencimiento y ya pasó la fecha, automáticamente es Vencida
  const diff = getDiffDays(task.fechaVencimiento);
  if (diff !== null && diff < 0) {
    return 'Vencida';
  }

  // Si no está vencida y su estado es "En proceso", se mantiene
  if (task.estado === 'En proceso') return 'En proceso';

  // Si está próxima a vencer (0 a 2 días restantes) y no está en proceso ni cumplida
  if (diff !== null && diff >= 0 && diff <= 2) {
    return 'Próxima a Vencer';
  }

  return task.estado || 'Pendiente';
}
