/**
 * QuickActionCard - Card de acción rápida para el onboarding y otras pantallas.
 *
 * Soporta dos variantes visuales:
 * - 'default': layout vertical con descripción y CTA a ancho completo.
 *              Para acciones principales que merecen jerarquía propia.
 * - 'compact': layout horizontal en una sola fila.
 *              Para espacios reducidos o listados de acciones secundarias.
 *
 * @example
 * <QuickActionCard
 *   iconName="add"
 *   iconColor={Colors.brand.primary}
 *   title="Crear nueva liga"
 *   description="Configura tu competición y empieza a gestionarla"
 *   ctaText="Crear liga"
 *   onPress={handleCreate}
 * />
 *
 * <QuickActionCard variant="compact" ... />
 */

import React, { memo } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { PrimaryPillButton } from '@/src/shared/components/ui/PrimaryPillButton';

interface QuickActionCardProps {
  /** Nombre del icono de Ionicons */
  iconName: keyof typeof Ionicons.glyphMap;
  /** Color del icono y su fondo circular semitransparente. Default: brand.primary */
  iconColor?: string;
  /** Título principal de la acción */
  title: string;
  /** Descripción secundaria (máx. 2 líneas en default, 1 en compact) */
  description: string;
  /** Texto del botón CTA */
  ctaText: string;
  /** Callback al pulsar el CTA */
  onPress?: () => void;
  /**
   * Variante visual:
   * - 'default' → vertical, icono + título arriba, descripción, CTA ancho abajo
   * - 'compact' → horizontal, todo en una sola fila
   */
  variant?: 'default' | 'compact';
  /** Estilo adicional para el contenedor raíz */
  style?: ViewStyle;
}

// Estilos compartidos entre variantes para evitar repetición
const CARD_BASE: ViewStyle = {
  backgroundColor: Colors.bg.surface1,
  borderRadius: theme.borderRadius.xl,
  borderWidth: 1,
  borderColor: Colors.bg.surface2,
};

function QuickActionCardComponent({
  iconName,
  iconColor = Colors.brand.primary,
  title,
  description,
  ctaText,
  onPress,
  variant = 'default',
  style,
}: QuickActionCardProps) {
  // Fondo circular: color de acento al ~9% de opacidad para no sobrecargar
  const iconBg = `${iconColor}18`;

  if (variant === 'compact') {
    return (
      <View
        style={[
          CARD_BASE,
          {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.md,
            gap: theme.spacing.md,
          },
          style,
        ]}
      >
        {/* Icono reducido */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>

        {/* Textos en flex:1 para empujar el CTA al extremo derecho */}
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              color: Colors.text.primary,
              fontSize: theme.fontSize.sm,
              fontWeight: '600',
              lineHeight: 20,
            }}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: Colors.text.secondary,
              fontSize: theme.fontSize.xs,
              lineHeight: 16,
            }}
          >
            {description}
          </Text>
        </View>

        {/* CTA compacto con ancho mínimo fijo */}
        <PrimaryPillButton
          label={ctaText}
          onPress={onPress}
          height={34}
          minWidth={88}
        />
      </View>
    );
  }

  // Variante default: vertical con más jerarquía
  return (
    <View
      style={[
        CARD_BASE,
        {
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        style,
      ]}
    >
      {/* Fila superior: icono + título en la misma línea */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        <Text
          style={{
            flex: 1,
            color: Colors.text.primary,
            fontSize: theme.fontSize.md,
            fontWeight: '600',
            lineHeight: 22,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Descripción: máx. 2 líneas para mantener la card compacta */}
      <Text
        numberOfLines={2}
        style={{
          color: Colors.text.secondary,
          fontSize: theme.fontSize.sm,
          lineHeight: 20,
        }}
      >
        {description}
      </Text>

      {/* CTA a ancho completo */}
      <PrimaryPillButton
        label={ctaText}
        onPress={onPress}
        height={44}
        style={{ marginTop: theme.spacing.xs }}
      />
    </View>
  );
}

export function QuickActionCard(props: QuickActionCardProps) {
  return <QuickActionCardComponent {...props} />;
}
