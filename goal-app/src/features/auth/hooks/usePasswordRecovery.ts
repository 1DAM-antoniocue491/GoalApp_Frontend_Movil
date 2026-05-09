/**
 * Hook para recuperación de contraseña.
 *
 * Centraliza el estado del flujo para que la pantalla solo tenga que consumir:
 * - estado de carga;
 * - errores visibles;
 * - paso actual del formulario;
 * - acciones para enviar email o confirmar nueva contraseña.
 */

import { useState } from 'react';
import { forgotPassword, resetPassword } from '@/src/features/auth/api/auth.api';

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

  /**
   * `step` permite controlar qué pantalla o bloque mostrar sin duplicar lógica
   * en los componentes: formulario de email, confirmación o nueva contraseña.
   */
  const [step, setStep] = useState<'email' | 'confirmation' | 'new-password'>('email');

  const sendRecoveryEmail = async (email: string) => {
    try {
      /**
       * Antes de cada petición se limpia el error anterior para que el usuario
       * no vea mensajes antiguos mientras se intenta una nueva acción.
       */
      setIsLoading(true);
      setError(null);

      await forgotPassword(email);

      /**
       * No se valida aquí si el email existe. Esa decisión corresponde al backend
       * para evitar enumeración de usuarios registrados.
       */
      setIsSent(true);
      setStep('confirmation');
    } catch (err) {
      /**
       * Se guarda el error para pintarlo en la interfaz, pero se relanza para
       * que la pantalla pueda ejecutar acciones extra si lo necesita.
       */
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

      /**
       * Al completar el reset, el flujo vuelve al inicio para permitir login
       * o un nuevo proceso de recuperación si fuera necesario.
       */
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
    /**
     * Reutiliza la misma lógica del primer envío para mantener comportamiento,
     * loading, errores y paso de confirmación consistentes.
     */
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
