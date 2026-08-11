/**
 * Maps Appwrite error identifiers to messages the accounting team can act on.
 * Raw SDK text is English and often leaks internals ("Invalid `password` param:
 * Password must be between 8 and 265 characters long").
 */

interface AppwriteLikeError {
  type?: string;
  code?: number;
  message?: string;
}

const BY_TYPE: Record<string, string> = {
  user_invalid_credentials: 'E-mail ou senha incorretos.',
  user_not_found: 'E-mail ou senha incorretos.',
  user_blocked: 'Esta conta está desativada. Contate o administrador do sistema.',
  user_email_already_exists: 'Já existe uma conta com este e-mail.',
  user_already_exists: 'Já existe uma conta com este e-mail.',
  user_password_mismatch: 'A senha atual informada está incorreta.',
  password_recently_used: 'Esta senha já foi utilizada. Escolha uma senha diferente.',
  password_personal_data: 'A senha não pode conter seus dados pessoais.',
  user_session_already_exists: 'Você já possui uma sessão ativa. Recarregue a página.',
  user_invalid_token: 'Este link de recuperação é inválido ou já foi utilizado.',
  general_rate_limit_exceeded:
    'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
  general_argument_invalid: 'Dados inválidos. Verifique os campos e tente novamente.',
  general_unauthorized_scope: 'Sua sessão expirou. Faça login novamente.',
};

const BY_CODE: Record<number, string> = {
  401: 'Sessão inválida ou expirada. Faça login novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Registro não encontrado.',
  409: 'Este registro já existe.',
  429: 'Muitas tentativas. Aguarde alguns minutos.',
  500: 'O serviço de autenticação está instável. Tente novamente em instantes.',
  503: 'Serviço temporariamente indisponível.',
};

export function translateAuthError(
  error: unknown,
  fallback = 'Não foi possível concluir a ação.'
): string {
  if (!error || typeof error !== 'object') return fallback;

  const candidate = error as AppwriteLikeError;

  // Bind each lookup to a local before testing it. Under
  // noUncheckedIndexedAccess a Record<string, string> access is
  // `string | undefined`, and TypeScript does not narrow two separate index
  // expressions as one — so `if (BY_TYPE[k]) return BY_TYPE[k]` fails to
  // compile. Binding also avoids doing the lookup twice.
  if (candidate.type) {
    const byType = BY_TYPE[candidate.type];
    if (byType) return byType;
  }

  if (typeof candidate.code === 'number') {
    const byCode = BY_CODE[candidate.code];
    if (byCode) return byCode;
  }

  // Network failure surfaces as a plain TypeError from fetch.
  if (error instanceof TypeError) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }

  return fallback;
}

/** Re-throws with a translated message so every caller gets friendly text. */
export function rethrowTranslated(error: unknown, fallback?: string): never {
  throw new Error(translateAuthError(error, fallback));
}
