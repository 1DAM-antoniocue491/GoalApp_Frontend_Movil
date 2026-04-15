import React from 'react';
import { View, ActivityIndicator } from 'react-native';

interface LoaderProps {
  /** Tamaño del indicador. Por defecto 'large' */
  size?: 'small' | 'large';
  /** Color del indicador. Por defecto el color primary del design system */
  color?: string;
  /** Si se muestra pantalla completa con fondo. Por defecto false */
  fullScreen?: boolean;
}

/**
 * Loader - Indicador de carga reutilizable
 *
 * @example
 * <Loader />
 * <Loader fullScreen />
 * <Loader size="small" color="#C4F135" />
 */
export function Loader({
  size = 'large',
  color = '#C4F135',
  fullScreen = false,
}: LoaderProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F13]">
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={color} />;
}