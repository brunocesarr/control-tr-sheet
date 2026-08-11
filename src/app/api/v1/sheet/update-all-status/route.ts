import { requireAdmin } from '@/helpers/auth.server';
import { getSheet, updateAllStatus } from '@/repositories/google.repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/sheet/update-all-status
 * Body: { hasDone: boolean }
 *
 * Diffs before writing so rows already in the target state are skipped.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const body = (await request.json().catch(() => null)) as { hasDone?: unknown } | null;
    const hasDone =
      typeof body?.hasDone === 'boolean'
        ? body.hasDone
        : String(body?.hasDone).toLowerCase() === 'true';

    if (body?.hasDone === undefined || body?.hasDone === null) {
      return Response.json({ message: 'hasDone é obrigatório.' }, { status: 400 });
    }

    const rows = await getSheet();
    const staleRanges = rows.filter((row) => row.hasDone !== hasDone).map((row) => row.cellRange);

    const updated = await updateAllStatus(staleRanges, hasDone);

    return Response.json({
      updated,
      skipped: rows.length - updated,
      hasDone,
    });
  } catch (error) {
    console.error('[api/v1/sheet/update-all-status] POST failed', error);
    return Response.json({ message: 'Não foi possível atualizar os status.' }, { status: 500 });
  }
}
