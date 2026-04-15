/**
 * FavoriteStar - Componente de estrella para favoritos
 *
 * Componente interactivo que muestra el estado de favorito de una liga.
 * Al presionar, alterna entre estado activo (amarillo) e inactivo (gris).
 *
 * @example
 * <FavoriteStar
 *   isFavorite={true}
 *   onPress={() => toggleFavorite()}
 *   size={24}
 * />
 */

import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FavoriteStarProps {
  /** Estado actual de favorito */
  isFavorite: boolean;
  /** Callback cuando se presiona la estrella */
  onPress: () => void;
  /** Tamaño del ícono (default: 24) */
  size?: number;
  /** Estilos adicionales */
  style?: ViewStyle;
  /** Si la estrella está deshabilitada */
  disabled?: boolean;
}

export function FavoriteStar({
  isFavorite,
  onPress,
  size = 24,
  style,
  disabled = false,
}: FavoriteStarProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={style}
      activeOpacity={0.7}
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
    >
      <Ionicons
        name={isFavorite ? 'star' : 'star-outline'}
        size={size}
        color={isFavorite ? '#FFD60A' : '#8A9AA4'}
      />
    </TouchableOpacity>
  );
}
