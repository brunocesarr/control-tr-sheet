import { requireAdmin } from '@/helpers/auth.server';
import { MAX_OBSERVATION_LENGTH, normaliseObservation } from '@/helpers/sheet-observations';
import { updateObservations } from '@/repositories/google.repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/v1/sheet/observations
 * Body: { cellRange: string; observations: string }
 *
 * `cellRange` is the row's STATUS reference. The repository derives the
 * OBSERVAÇÕES target from the header row — the column is never client-supplied.
 */
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const body = (await request.json().catch(() => null)) as {
      cellRange?: string;
      observations?: unknown;
    } | null;

    // Same whitelist as PATCH /api/v1/sheet: this string reaches a spreadsheet
    // range, so arbitrary input is never acceptable.
    if (!body?.cellRange || !/^[A-Z]{1,3}[1-9]\d{0,6}$/.test(body.cellRange)) {
      return Response.json({ message: 'cellRange inválido.' }, { status: 400 });
    }

    // Absent is not the same as empty: clearing a note sends ''.
    if (body.observations !== undefined && typeof body.observations !== 'string') {
      return Response.json({ message: 'observations deve ser texto.' }, { status: 400 });
    }

    const raw = typeof body.observations === 'string' ? body.observations : '';

    // Reject rather than silently truncate — a caller that exceeds the limit
    // has a bug, and quietly losing the tail is worse than a 400.
    if (raw.length > MAX_OBSERVATION_LENGTH) {
      return Response.json(
        { message: `A observação excede ${MAX_OBSERVATION_LENGTH} caracteres.` },
        { status: 400 }
      );
    }

    const result = await updateObservations(body.cellRange, normaliseObservation(raw));

    return Response.json({
      statusCellRange: body.cellRange,
      observationsCellRange: result.cellRange,
      observations: result.observations,
    });
  } catch (error) {
    console.error('[api/v1/sheet/observations] PATCH failed', error);

    /**
     * A missing OBSERVAÇÕES column is a configuration problem the user can
     * actually fix, so surface that one case. Everything else stays generic to
     * avoid leaking sheet ids or service-account emails.
     */
    const isMissingColumn =
      error instanceof Error && error.message.includes('não encontrada na planilha');

    return Response.json(
      {
        message: isMissingColumn
          ? 'A coluna "OBSERVAÇÕES" não foi encontrada na planilha.'
          : 'Não foi possível salvar a observação.',
      },
      { status: isMissingColumn ? 422 : 500 }
    );
  }
}
