import { requireAdmin } from '@/helpers/auth.server';
import { getSheet, updateAllStatus } from '@/repositories/google.repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Same whitelist the single-cell PATCH route uses. */
const A1_PATTERN = /^[A-Z]{1,3}[1-9]\d{0,6}$/;
/** Ceiling so one request cannot fan out into an unbounded Sheets write. */
const MAX_SELECTION = 500;

/**
 * POST /api/v1/sheet/update-all-status
 * Body: { hasDone: boolean, cellRanges?: string[] }
 *
 * Without `cellRanges` every row is targeted (the original behaviour).
 * With `cellRanges` only that subset is — this is what the dashboard's
 * selection bar uses, so users no longer have to choose between "one row" and
 * "the entire sheet".
 *
 * Either way rows already in the target state are diffed out before writing.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const body = (await request.json().catch(() => null)) as {
      hasDone?: unknown;
      cellRanges?: unknown;
    } | null;

    if (typeof body?.hasDone !== 'boolean') {
      return Response.json({ message: 'hasDone deve ser booleano.' }, { status: 400 });
    }
    const hasDone = body.hasDone;

    let selection: Set<string> | null = null;
    if (body.cellRanges !== undefined) {
      if (!Array.isArray(body.cellRanges) || body.cellRanges.length === 0) {
        return Response.json(
          { message: 'cellRanges deve ser um array não vazio.' },
          { status: 400 }
        );
      }
      if (body.cellRanges.length > MAX_SELECTION) {
        return Response.json(
          { message: `Selecione no máximo ${MAX_SELECTION} registros por vez.` },
          { status: 400 }
        );
      }
      if (!body.cellRanges.every((r) => typeof r === 'string' && A1_PATTERN.test(r))) {
        return Response.json(
          { message: 'cellRanges contém referência inválida.' },
          { status: 400 }
        );
      }
      selection = new Set(body.cellRanges as string[]);
    }

    const rows = await getSheet();
    const scoped = selection ? rows.filter((row) => selection.has(row.cellRange)) : rows;
    const staleRanges = scoped.filter((row) => row.hasDone !== hasDone).map((row) => row.cellRange);

    // google.repository.updateAllStatus re-validates every range against the
    // resolved STATUS column before writing (defence in depth).
    const updated = await updateAllStatus(staleRanges, hasDone);

    return Response.json({ updated, skipped: scoped.length - updated, hasDone });
  } catch (error) {
    console.error('[api/v1/sheet/update-all-status] POST failed', error);
    return Response.json({ message: 'Não foi possível atualizar os status.' }, { status: 500 });
  }
}
