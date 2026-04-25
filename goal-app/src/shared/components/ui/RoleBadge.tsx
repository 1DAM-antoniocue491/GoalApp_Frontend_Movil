import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props del badge de rol.
 *
 * Este componente vive en shared porque el patrón visual
 * "badge pequeño con icono + texto" puede reutilizarse
 * en varias pantallas del proyecto.
 */
interface RoleBadgeProps {
  label: string;
  bgColor: string;
  textColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function RoleBadgeComponent({
  label,
  bgColor,
  textColor,
  icon,
}: RoleBadgeProps) {
  return (
    <View
      /**
       * className se usa aquí para la estructura:
       * - self-start para que el badge no ocupe ancho completo
       * - flex-row porque icono y texto deben ir en línea
       * - items-center para alineación vertical
       * - padding y radio porque son valores fijos del patrón
       *
       * style se usa para el color de fondo porque bgColor es dinámico
       * y viene por props.
       */
      className="self-start flex-row items-center px-3 py-2 rounded-xl"
      style={{ backgroundColor: bgColor }}
    >
      <Ionicons
        name={icon}
        size={14}
        color={textColor}
        /**
         * style aquí se usa solo para separación fina del icono.
         * No compensa mover este marginRight a className porque
         * queremos mantenerlo muy explícito y controlado.
         */
        style={{ marginRight: 6 }}
      />

      <Text
        /**
         * style se usa porque textColor es dinámico
         * y además aquí controlamos tamaño y line-height
         * con precisión visual.
         */
        style={{
          color: textColor,
          fontSize: 13,
          lineHeight: 16,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export const RoleBadge = memo(RoleBadgeComponent);