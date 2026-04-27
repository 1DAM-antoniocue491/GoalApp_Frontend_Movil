/**
 * Hook para recuperación de contraseña
 *
 * Gestiona el flujo completo:
 * 1. Enviar email de recuperación
 * 2. Confirmación de envío
 * 3. Resetear contraseña con token
 */

import { useState } from 'react';
import { forgotPassword, resetPassword } from '@/src/app/auth/api/auth.api';

interface UsePasswordRecoveryReturn {
  isLoading: boolean;
  isSent: boolean;
  error: string | null;
  step: 'email' | 'confirmation' | 'new-password';
  sendRecoveryEmail: (email: string) => Promise<void>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<void>;
  resendEmail: (email: string) => Promise<void>;
  clearError: () => void;
}

export function usePasswordRecovery(): UsePasswordRecoveryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'confirmation' | 'new-password'>('email');

  const sendRecoveryEmail = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await forgotPassword(email);
      setIsSent(true);
      setStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await resetPassword({ token, nueva_contrasena: newPassword });
      setStep('email');
      setIsSent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resetear contraseña');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmail = async (email: string) => {
    return sendRecoveryEmail(email);
  };

  const clearError = () => setError(null);

  return {
    isLoading,
    isSent,
    error,
    step,
    sendRecoveryEmail,
    resetPasswordWithToken,
    resendEmail,
    clearError,
  };
}
