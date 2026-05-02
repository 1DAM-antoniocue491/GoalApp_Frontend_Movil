/**
 * NotificationCard
 *
 * Tarjeta premium dark de una notificación.
 *
 * Comportamiento mobile-first (sin hover):
 * - Botón ⋮ siempre visible → abre action sheet con opciones
 * - onLongPress sobre la tarjeta → mismo action sheet
 *
 * Estado visual:
 * - No leída: fondo surface2, borde con tinte brand, título en bold, punto verde
 * - Leída: fondo surface1, borde surface2, título normal
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { AppNotification, NotificationCategory } from '../types/notifications.types';

// Icono Ionicons por categoría (incluye 'all' como fallback)
const CATEGORY_ICON: Record<NotificationCategory, keyof typeof Ionicons.glyphMap> = {
  all:      'notifications-outline',
  matches:  'radio-outline',
  results:  'trophy-outline',
  teams:    'people-outline',
  players:  'person-outline',
  stats:    'stats-chart-outline',
  league:   'shield-outline',
  roles:    'key-outline',
  events:   'football-outline',
  system:   'construct-outline',
};

// Color de acento por categoría
const CATEGORY_COLOR: Record<NotificationCategory, string> = {
  all:      Colors.text.secondary,
  matches:  Colors.semantic.error,
  results:  Colors.brand.primary,
  teams:    Colors.brand.secondary,
  players:  Colors.text.secondary,
  stats:    Colors.brand.accent,
  league:   Colors.brand.primary,
  roles:    Colors.semantic.warning,
  events:   Colors.semantic.error,
  system:   Colors.semantic.warning,
};

/** Formatea fecha ISO a texto relativo simple */
function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

interface NotificationCardProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onDelete: (id: string) => void;
  onOpenMenu: (notification: AppNotification) => void;
}

function NotificationCardComponent({
  notification,
  onPress,
  onDelete,
  onOpenMenu,
}: NotificationCardProps) {
  const { id, title, body, category, isRead, createdAt } = notification;
  const iconName = CATEGORY_ICON[category] ?? 'notifications-outline';
  const accentColor = CATEGORY_COLOR[category] ?? Colors.text.secondary;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress(notification)}
      onLongPress={() => onOpenMenu(notification)}
      delayLongPress={400}
      style={{
        backgroundColor: isRead ? Colors.bg.surface1 : Colors.bg.surface2,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: isRead
          ? Colors.bg.surface2
          : Colors.brand.primary + '40',
        marginBottom: theme.spacing.md,
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
      }}
    >
      {/* Punto indicador de no leído */}
      {!isRead && (
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.lg + 6,
            left: 6,
            width: 6,
            height: 6,
            borderRadius: theme.borderRadius.full,
            backgroundColor: Colors.brand.primary,
          }}
        />
      )}

      {/* Icono de categoría */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: accentColor + '1A',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name={iconName} size={20} color={accentColor} />
      </View>

      {/* Texto */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: Colors.text.primary,
            fontSize: theme.fontSize.sm,
            fontWeight: isRead ? '400' : '700',
            marginBottom: 3,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            color: Colors.text.secondary,
            fontSize: theme.fontSize.xs,
            lineHeight: 17,
            marginBottom: theme.spacing.xs,
          }}
          numberOfLines={2}
        >
          {body}
        </Text>
        <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs }}>
          {formatRelative(createdAt)}
        </Text>
      </View>

      {/* Menú 3 puntos */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, flexShrink: 0 }}>
        <TouchableOpacity
          onPress={() => onOpenMenu(notification)}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export const NotificationCard = memo(NotificationCardComponent);
