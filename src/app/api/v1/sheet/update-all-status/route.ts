import { type NextRequest } from 'next/server';

import type { SheetRowData } from '@/interfaces/tr-sheet';
import { getSheet, updateAllStatus } from '@/repositories/google.repository';
import { LocalStorageKeysCache } from '@/configs/local-storage-keys';
import { cookies } from 'next/headers';
import { isAdminToken } from '@/helpers/validators';

const isAdmin = async () => {
  const cookie = await cookies();
  const token = cookie.get(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET);
  return isAdminToken(token?.value);
};

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin()))
      return new Response(
        JSON.stringify({
          message: 'Unauthorized',
        }),
        { status: 401 }
      );

    const formData = await request.formData();
    const hasDone = formData.get('has_done');

    if (hasDone === null) return Response.json('Invalid Paramter', { status: 400 });

    const data = await getSheet();

    if (data == null || Object.values(data).length <= 0)
      return new Response(null, {
        status: 204,
      });

    const response = data
      .map((row) => {
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
      })
      .filter((row) => row.hasDone !== (hasDone.toString().toLowerCase() === 'true'));

    if (response.length <= 0) return new Response(null, { status: 204 });

    await updateAllStatus(
      response.map((r) => r.cellRange),
      hasDone.toString().toLowerCase() === 'true'
    );
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
