import React, { memo } from 'react';
import { TouchableOpacity, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

/**
 * Botón principal reutilizable del proyecto.
 *
 * Lo usamos en cards y acciones destacadas porque
 * ya repites mucho el patrón:
 * - fondo brand.primary
 * - texto oscuro
 * - flecha a la derecha
 * - altura fija
 * - radio grande
 */
interface PrimaryPillButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  minWidth?: number;
  height?: number;
  style?: ViewStyle;
}

function PrimaryPillButtonComponent({
  label,
  onPress,
  disabled = false,
  minWidth = 120,
  height = 20,
  style,
}: PrimaryPillButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.9}
      disabled={disabled}
      onPress={onPress}
      /**
       * className se usa para:
       * - layout interno horizontal
       * - centrado
       * - radio base
       *
       * style se usa para:
       * - minWidth
       * - height
       * - background dinámico según disabled
       * - estilos externos inyectados
       *
       * Esto se hace así porque esos valores no son todos fijos.
       */
      className="flex-row items-center justify-between rounded-xl"
      style={[
        {
          minWidth,
          height,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: disabled
            ? `${Colors.brand.primary}40`
            : Colors.brand.primary,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: Colors.bg.base,
          fontSize: theme.fontSize.sm,
          lineHeight: 20,
          fontWeight: '700',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {label}
      </Text>

      <Ionicons
        name="arrow-forward"
        size={18}
        color={Colors.bg.base}
        style={{
          marginLeft: theme.spacing.sm,
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </TouchableOpacity>
  );
}

export const PrimaryPillButton = memo(PrimaryPillButtonComponent);