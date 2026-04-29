/**
 * NotificationCard
 *
 * Tarjeta premium dark de una notificación.
 *
 * Comportamiento mobile-first (sin hover):
 * - Papelera siempre visible → elimina directamente sin confirmar
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

// Icono de Ionicons por categoría
const CATEGORY_ICON: Record<NotificationCategory, keyof typeof Ionicons.glyphMap> = {
  live: 'pulse-outline',
  teams: 'people-outline',
  statistics: 'stats-chart-outline',
  results: 'trophy-outline',
  maintenance: 'construct-outline',
  players: 'person-outline',
  league: 'football-outline',
};

// Color de acento del icono por categoría
const CATEGORY_COLOR: Record<NotificationCategory, string> = {
  live: Colors.semantic.error,    // rojo → urgencia en vivo
  results: Colors.brand.primary,     // lima → resultado finalizado
  teams: Colors.brand.secondary,   // azul claro → equipos
  statistics: Colors.brand.accent,      // azul → estadísticas
  maintenance: Colors.semantic.warning,  // amarillo → aviso de sistema
  players: Colors.text.secondary,    // gris neutro → jugadores
  league: Colors.brand.primary,     // lima → noticias de liga
};

/** Formatea fecha ISO a texto relativo simple (ej: "hace 3h") */
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
  /** Pulsar la tarjeta: marca como leída y navega a targetRoute */
  onPress: (notification: AppNotification) => void;
  /** Elimina sin confirmar — la papelera es siempre visible (mobile-first, sin hover) */
  onDelete: (id: string) => void;
  /** Abre el action sheet con más opciones (marcar leída, eliminar) */
  onOpenMenu: (notification: AppNotification) => void;
}

function NotificationCardComponent({
  notification,
  onPress,
  onDelete,
  onOpenMenu,
}: NotificationCardProps) {
  const { id, title, body, category, isRead, createdAt } = notification;
  const iconName = CATEGORY_ICON[category];
  const accentColor = CATEGORY_COLOR[category];

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress(notification)}
      onLongPress={() => onOpenMenu(notification)}
      delayLongPress={400}
      style={{
        // style: fondo y borde cambian según isRead — no representable solo con className
        backgroundColor: isRead ? Colors.bg.surface1 : Colors.bg.surface2,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: isRead
          ? Colors.bg.surface2
          : Colors.brand.primary + '40', // 25% opacidad del verde lima
        marginBottom: theme.spacing.md,
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
      }}
    >
      {/* Punto indicador de no leído — izquierda del icono */}
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

      {/* Icono de categoría con fondo tintado */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.borderRadius.lg,
          // style: color de fondo derivado del acento de categoría con 10% opacidad
          backgroundColor: accentColor + '1A',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name={iconName} size={20} color={accentColor} />
      </View>

      {/* Texto: título, cuerpo, timestamp */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: Colors.text.primary,
            fontSize: theme.fontSize.sm,
            // Título en bold cuando no está leída para reforzar jerarquía
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

      {/* Acciones: papelera (siempre visible) + menú 3 puntos */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          flexShrink: 0,
        }}
      >
        {/* 3 puntos → action sheet con opciones adicionales */}
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
