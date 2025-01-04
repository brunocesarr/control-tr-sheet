import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SheetRowData } from '@/interfaces/tr-sheet';
import { getSheet, updateStatus } from '@/repositories/google.repository';

export async function GET() {
  try {
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
    let errorMessage = (error as Error).message;
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
    let errorMessage = (error as Error).message;
    return new Response(
      JSON.stringify({
        message: 'Internal Server Error',
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}
