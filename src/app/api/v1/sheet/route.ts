import { requireAdmin } from '@/helpers/auth.server';
import { getSheet, updateStatus } from '@/repositories/google.repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/sheet — full ITR list. */
export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const rows = await getSheet();
    return Response.json(rows, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[api/v1/sheet] GET failed', error);
    // Never echo raw error messages — they can leak sheet ids / emails.
    return Response.json({ message: 'Não foi possível carregar a planilha.' }, { status: 500 });
  }
}

/** PATCH /api/v1/sheet — toggle one row. Body: { cellRange, hasDone } */
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const body = (await request.json().catch(() => null)) as {
      cellRange?: string;
      hasDone?: boolean;
    } | null;

    // Whitelist the A1 reference — this string is interpolated into a
    // spreadsheet range, so it must never accept arbitrary input.
    if (!body?.cellRange || !/^[A-Z]{1,3}[1-9]\d{0,6}$/.test(body.cellRange)) {
      return Response.json({ message: 'cellRange inválido.' }, { status: 400 });
    }
    if (typeof body.hasDone !== 'boolean') {
      return Response.json({ message: 'hasDone deve ser booleano.' }, { status: 400 });
    }

    await updateStatus(body.cellRange, body.hasDone);
    return Response.json({ cellRange: body.cellRange, hasDone: body.hasDone });
  } catch (error) {
    console.error('[api/v1/sheet] PATCH failed', error);
    return Response.json({ message: 'Não foi possível atualizar o status.' }, { status: 500 });
  }
}
