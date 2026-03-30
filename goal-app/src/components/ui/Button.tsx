// Bóton propio
// El botón primario (fondo lima #C4F135) es el  principal de la app.
// Centralizar su estilo y estado de loading/disabled aquí

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { styles } from '../../styles';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({
  label,
  isLoading = false,
  variant = 'primary',
  disabled,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      className={isPrimary ? styles.btnPrimary : styles.btnSecondary}
      disabled={disabled || isLoading}
      // Opacidad al 50% cuando está deshabilitado — feedback visual
      style={{ opacity: disabled || isLoading ? 0.5 : 1 }}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        // Feedback mientras espera respuesta del servidor
        <ActivityIndicator color={isPrimary ? '#000000' : '#FFFFFF'} />
      ) : (
        <Text className={isPrimary ? styles.btnPrimaryText : styles.btnSecondaryText}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}