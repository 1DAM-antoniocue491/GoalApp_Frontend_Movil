/**
 * QuickActionCard - Cards de acciones rápidas para la pantalla de inicio
 *
 * Se usa para las cards de "Crear nueva liga" y "Unirme a una liga"
 * con diseño premium, icono circular decorativo y botón CTA.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionCardProps {
  /** Icono a mostrar (nombre de Ionicons) */
  iconName: keyof typeof Ionicons.glyphMap;
  /** Color del icono */
  iconColor?: string;
  /** Título principal de la card */
  title: string;
  /** Descripción secundaria */
  description: string;
  /** Texto del botón CTA */
  ctaText: string;
  /** Acción al presionar el botón CTA */
  onPress?: () => void;
  /** Estilo adicional para el contenedor */
  style?: ViewStyle;
}

export function QuickActionCard({
  iconName,
  iconColor = '#C4F135',
  title,
  description,
  ctaText,
  onPress,
  style,
}: QuickActionCardProps) {
  return (
    <View
      className="bg-[#1D1C22] rounded-3xl p-5 gap-4 border border-[#2A2A35]"
      style={style}
    >
      {/* Icono circular decorativo */}
      <View
        className="h-12 w-12 rounded-full items-center justify-center"
        style={{ backgroundColor: `${iconColor}15` }} // 15 = ~8% opacity
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>

      {/* Textos */}
      <View className="gap-1">
        <Text className="text-white font-semibold text-lg">{title}</Text>
        <Text className="text-[#8A9AA4] text-sm">{description}</Text>
      </View>

      {/* Botón CTA con flecha */}
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between bg-[#C4F135] rounded-2xl py-3 px-4 mt-1"
      >
        <Text className="text-black font-bold text-base">{ctaText}</Text>
        <Ionicons name="arrow-forward" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );
}
