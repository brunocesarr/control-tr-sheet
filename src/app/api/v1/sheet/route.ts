import { type NextRequest } from 'next/server';

import type { SheetRowData } from '@/interfaces/tr-sheet';
import { getSheet, updateStatus } from '@/repositories/google.repository';
import { isAdminToken } from '@/helpers/validators';
import { cookies } from 'next/headers';
import { LocalStorageKeysCache } from '@/configs/local-storage-keys';

const isAdmin = async () => {
  const cookie = await cookies();
  const token = cookie.get(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET);
  return isAdminToken(token?.value);
};

export async function GET() {
  try {
    if (!(await isAdmin()))
      return new Response(
        JSON.stringify({
          message: 'Unauthorized',
        }),
        { status: 401 }
      );

    const data = await getSheet();

    if (data == null || Object.values(data).length <= 0)
      return new Response(null, {
        status: 204,
      });

    const response = data.map((row) => {
      const values = Object.values(row.toObject());
      const sheetInfos = row.a1Range.split('!');
      return {
        cellRange: sheetInfos[sheetInfos.length - 1],
        hasDone: values[0].toLowerCase() == 'true',
        cpf: values[2],
        name: values[3],
        status: values[1],
        cib: values[4],
        imovelRural: values[5],
        observations: values[6],
      } as SheetRowData;
    });

    return Response.json(response);
  } catch (error) {
    const errorMessage = (error as Error).message;
    return new Response(
      JSON.stringify({
        message: 'Internal Server Error',
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin()))
      return new Response(
        JSON.stringify({
          message: 'Unauthorized',
        }),
        { status: 401 }
      );

    const formData = await request.formData();
    const range = formData.get('range');
    const hasDone = formData.get('has_done');

    if (!range || range.toString().length <= 0 || hasDone === null)
      return Response.json('Invalid Paramter', { status: 400 });

    await updateStatus(range.toString(), hasDone.toString().toLowerCase() === 'true');
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return new Response(
      JSON.stringify({
        message: 'Internal Server Error',
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}
