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
      range: 'Tareas!A:T',
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
      docenteVinculado: row[17] || '',
      docenteEmail: row[18] || '',
      docenteTelefono: row[19] || '',
    }));

    // Si es Administrador/Supervisor, ve todas
    if (user.cargo?.toLowerCase().includes('admin') || user.cargo?.toLowerCase().includes('supervisor') || user.cargo?.toLowerCase().includes('jefe')) {
      return tasks;
    }

    // Operador normal ve solo las asignadas a su cargo, sin importar el area
    return tasks.filter(t => t.cargo === user.cargo);
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
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return d;
  };

  const fechaInicioRaw = formData.get('fechaInicio')?.toString() || '';
  const fechaVencimientoRaw = formData.get('fechaVencimiento')?.toString() || '';
  const fechaCumplimientoRaw = formData.get('fechaCumplimiento')?.toString() || '';

  const fechaInicio = parseDate(fechaInicioRaw);
  const fechaVencimiento = parseDate(fechaVencimientoRaw);
  const fechaCumplimiento = parseDate(fechaCumplimientoRaw);

  const prioridad = formData.get('prioridad')?.toString() || 'Media';
  const docenteVinculado = formData.get('docenteVinculado')?.toString() || '';
  const docenteEmail = formData.get('docenteEmail')?.toString() || '';
  const docenteTelefono = formData.get('docenteTelefono')?.toString() || '';

  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('es-AR', options);
  const fechaHoy = formatter.format(today);
  
  const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const timestamp = new Intl.DateTimeFormat('es-AR', timeOptions).format(today);
  
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
    evidencia || '',
    docenteVinculado || '',
    docenteEmail || '',
    docenteTelefono || ''
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tareas!A:T',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [newRow],
    },
  });

  revalidatePath('/dashboard');
}

export async function getDocentes() {
  const session = await getSession();
  if (!session) return [];

  const sheets = await getGoogleSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'personal docente!A:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    return rows.slice(1).map(row => {
      // El usuario indicó que el nombre está en la columna A (row[0])
      const nombreCompleto = row[0] ? String(row[0]).trim() : '';
      
      const email = typeof row[4] === 'string' && row[4].includes('@') ? row[4] : (row.find(val => typeof val === 'string' && val.includes('@')) || '');
      
      const digitRegex = /\d{8,}/;
      const telefono = typeof row[5] === 'string' && digitRegex.test(row[5]) ? row[5] : (row.find(val => typeof val === 'string' && !val.includes('@') && digitRegex.test(val)) || '');

      return {
        id: row[0] || '',
        nombre: nombreCompleto,
        email,
        telefono
      };
    }).filter(docente => docente.nombre !== '');
  } catch (error) {
    console.error('Error fetching docentes', error);
    return [];
  }
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
