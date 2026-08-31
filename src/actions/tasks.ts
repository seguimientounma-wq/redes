'use server';

import { getGoogleSheetsClient, SPREADSHEET_ID } from '@/lib/googleSheets';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function getTasks() {
  const session = await getSession();
  if (!session) return [];

  const { user } = session;
  const sheets = await getGoogleSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tareas!A:Q',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // Omitir cabecera
    const tasks = rows.slice(1).map((row, index) => ({
      rowIndex: index + 2, // Fila real en Google Sheets (1-based + 1 por cabecera)
      timestamp: row[0] || '',
      id: row[1] || '',
      dniAsignado: row[2] || '',
      nombreAsignado: row[3] || '',
      apellidoAsignado: row[4] || '',
      area: row[5] || '',
      cargo: row[6] || '',
      tipo: row[7] || '',
      descripcion: row[8] || '',
      entregable: row[9] || '',
      fechaAsignacion: row[10] || '',
      fechaInicio: row[11] || '',
      fechaVencimiento: row[12] || '',
      prioridad: row[13] || '',
      estado: row[14] || '',
      fechaCumplimiento: row[15] || '',
      evidencia: row[16] || '',
    }));

    // Si es Administrador/Supervisor, ve las de su área o todas (depende regla, ahora filtramos por Area si queremos, o TODAS)
    // El usuario pidió: admin ve todas, operador ve las suyas.
    if (user.cargo?.toLowerCase().includes('admin') || user.cargo?.toLowerCase().includes('supervisor') || user.cargo?.toLowerCase().includes('jefe')) {
      return tasks;
    }

    // Operador normal ve solo las asignadas a su DNI
    return tasks.filter(t => t.dniAsignado === user.dni);
  } catch (error) {
    console.error('Error fetching tasks', error);
    return [];
  }
}

export async function updateTaskAction(rowIndex: number, estado: string, evidencia: string, fechaCumplimientoRaw: string) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const sheets = await getGoogleSheetsClient();
  
  const parseDate = (d: string) => {
    if (!d) return '';
    if (d.includes('-')) {
      const parts = d.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return d;
  };

  const fechaCumplimiento = parseDate(fechaCumplimientoRaw);

  // En la nueva estructura: O es Estado, P es Fecha_Cumplimiento, Q es Evidencia
  const range = `Tareas!O${rowIndex}:Q${rowIndex}`;
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[estado, fechaCumplimiento, evidencia]],
    },
  });

  revalidatePath('/dashboard');
}

export async function createTaskAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const { user } = session;
  const sheets = await getGoogleSheetsClient();

  const tipo = formData.get('tipo')?.toString() || '';
  const descripcion = formData.get('descripcion')?.toString() || '';
  const entregable = formData.get('entregable')?.toString() || '';
  const estado = formData.get('estado')?.toString() || 'Pendiente';
  const evidencia = formData.get('evidencia')?.toString() || '';
  
  // Helper para asegurar que la fecha esté en formato DD/MM/YYYY
  const parseDate = (d: string) => {
    if (!d) return '';
    if (d.includes('-')) {
      const parts = d.split('-');
      if (parts.length === 3) {
        // YYYY-MM-DD to DD/MM/YYYY
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return d; // Si ya venía en otro formato, lo deja
  };

  const fechaInicioRaw = formData.get('fechaInicio')?.toString() || '';
  const fechaVencimientoRaw = formData.get('fechaVencimiento')?.toString() || '';
  const fechaCumplimientoRaw = formData.get('fechaCumplimiento')?.toString() || '';

  const fechaInicio = parseDate(fechaInicioRaw);
  const fechaVencimiento = parseDate(fechaVencimientoRaw);
  const fechaCumplimiento = parseDate(fechaCumplimientoRaw);

  const prioridad = formData.get('prioridad')?.toString() || 'Media';

  const today = new Date();
  const fechaHoy = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  const timestamp = new Date().toLocaleString('es-AR');
  
  const id = `T-${Date.now().toString().slice(-6)}`;

  const partesNombre = user.nombre.split(' ');
  const nombre = partesNombre[0] || '';
  const apellido = partesNombre.slice(1).join(' ') || '';

  const newRow = [
    timestamp,
    id,
    user.dni || '',
    nombre || '',
    apellido || '',
    user.area || '',
    user.cargo || '',
    tipo || '',
    descripcion || '',
    entregable || '',
    fechaHoy || '', 
    fechaInicio || '', 
    fechaVencimiento || '', 
    prioridad || '', 
    estado || '',
    fechaCumplimiento || (estado === 'Cumplida' ? fechaHoy : ''), 
    evidencia || ''
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tareas!A:Q',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [newRow],
    },
  });

  revalidatePath('/dashboard');
}

export async function getComments(taskId: string) {
  const session = await getSession();
  if (!session) return [];

  const sheets = await getGoogleSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Comentarios!A:D',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    return rows.slice(1)
      .filter(row => row[0] === taskId)
      .map(row => ({
        idTarea: row[0] || '',
        autor: row[1] || '',
        comentario: row[2] || '',
        fecha: row[3] || '',
      }));
  } catch (error) {
    console.error('Error fetching comments', error);
    return [];
  }
}

export async function addCommentAction(taskId: string, comentario: string) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const { user } = session;
  const sheets = await getGoogleSheetsClient();

  const timestamp = new Date().toLocaleString('es-AR');
  const autor = `${user.nombre} (${user.cargo})`;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Comentarios!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[taskId, autor, comentario, timestamp]],
    },
  });

  revalidatePath('/dashboard');
}
