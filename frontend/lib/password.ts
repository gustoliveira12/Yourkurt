export const MIN_PASSWORD_LENGTH = 6;

export function validateNewPassword(password: string, confirmPassword: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (password !== confirmPassword) {
    return "As senhas não coincidem.";
  }

  return null;
}

export function getAuthErrorMessage(rawMessage: string) {
  const lowered = rawMessage.toLowerCase();

  if (lowered.includes("rate limit") || lowered.includes("too many requests")) {
    return "Você atingiu o limite de envios por agora. Aguarde alguns minutos e tente novamente.";
  }

  if (lowered.includes("same password") || lowered.includes("different from the old")) {
    return "A nova senha deve ser diferente da senha atual.";
  }

  if (lowered.includes("weak") || lowered.includes("at least")) {
    return "A nova senha é muito fraca. Use uma senha mais forte.";
  }

  if (lowered.includes("session") || lowered.includes("not authenticated")) {
    return "Sua sessão expirou. Entre novamente ou solicite um novo link.";
  }

  return rawMessage;
}
