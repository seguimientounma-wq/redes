'use server';

import { getGoogleSheetsClient, SPREADSHEET_ID } from '@/lib/googleSheets';
import { createSession, destroySession } from '@/lib/session';

export async function loginAction(formData: FormData) {
  const dni = formData.get('dni')?.toString();
  const pin = formData.get('pin')?.toString();

  if (!dni || !pin) {
    return { error: 'Por favor, ingresa DNI y PIN.' };
  }

  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Usuarios!A2:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { error: 'No se encontraron usuarios en la base de datos.' };
    }

    // Buscar al usuario por DNI
    // Columnas: A: ID, B: DNI, C: PIN, D: Nombre, E: Apellido, F: Area, G: Cargo, H: Estado_Usuario
    const userRow = rows.find(row => row[1] === dni && row[2] === pin);

    if (!userRow) {
      return { error: 'DNI o PIN incorrectos.' };
    }

    const estadoUsuario = userRow[7];
    if (estadoUsuario !== 'Activo') {
      return { error: `Tu usuario no está activo (Estado: ${estadoUsuario}). Contacta al administrador.` };
    }

    // Crear sesión
    const userData = {
      dni: userRow[1],
      nombre: `${userRow[3]} ${userRow[4]}`,
      area: userRow[5],
      cargo: userRow[6],
    };

    await createSession(userData);
    return { success: true };

  } catch (error) {
    console.error('Error en login:', error);
    return { error: 'Ocurrió un error al conectar con la base de datos.' };
  }
}

export async function logoutAction() {
  await destroySession();
}
