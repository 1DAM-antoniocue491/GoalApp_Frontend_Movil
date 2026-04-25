import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { theme } from '@/src/shared/styles/theme';

/**
 * Componente pequeño para mostrar un estado visual:
 * - punto de color
 * - texto con el mismo color
 *
 * Sirve para estados como:
 * - Activa
 * - Finalizada
 * - En vivo
 * - Pendiente
 */
interface StatusDotLabelProps {
  label: string;
  color: string;
}

function StatusDotLabelComponent({ label, color }: StatusDotLabelProps) {
  return (
    <View
      /**
       * className para estructura fija horizontal.
       * Este patrón es estable y no depende de props.
       */
      className="flex-row items-center"
    >
      <View
        /**
         * className para la geometría fija del punto.
         * style solo para el color dinámico.
         */
        className="w-2.5 h-2.5 rounded-full mr-2"
        style={{ backgroundColor: color }}
      />

      <Text
        /**
         * style se usa aquí porque el color es dinámico.
         * Además el texto de estado necesita line-height preciso
         * para que quede bien alineado con el punto.
         */
        style={{
          color,
          fontSize: theme.fontSize.sm - 1,
          lineHeight: 20,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export const StatusDotLabel = memo(StatusDotLabelComponent);