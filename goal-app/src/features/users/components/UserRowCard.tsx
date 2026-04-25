/**
 * UserRowCard
 *
 * Tarjeta de fila para un miembro de la liga.
 * Muestra: avatar con iniciales, nombre, email, badge de rol,
 * estado (Activo/Pendiente) y botón Gestionar.
 *
 * Reutiliza:
 * - RoleBadge (shared) → badge visual del rol
 * - StatusDotLabel (shared) → punto de estado
 * - PrimaryPillButton (shared) → botón Gestionar
 * - Colors, theme (shared)
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleBadge } from '@/src/shared/components/ui/RoleBadge';
import { StatusDotLabel } from '@/src/shared/components/ui/StatusDotLabel';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { LeagueUser, UserRole } from '../types/users.types';

// ─── Config visual de roles ───────────────────────────────────────────────────

// Definida aquí porque solo se usa en esta tarjeta
const ROLE_CONFIG: Record<UserRole, {
  label: string;
  bgColor: string;
  textColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  admin: {
    label: 'Administrador',
    bgColor: 'rgba(200,245,88,0.15)',
    textColor: Colors.brand.primary,
    icon: 'shield-outline',
  },
  coach: {
    label: 'Entrenador',
    bgColor: 'rgba(0,180,216,0.15)',
    textColor: Colors.brand.secondary,
    icon: 'ribbon-outline',
  },
  player: {
    label: 'Jugador',
    bgColor: 'rgba(24,162,251,0.15)',
    textColor: Colors.brand.accent,
    icon: 'football-outline',
  },
  delegate: {
    label: 'Delegado',
    bgColor: 'rgba(255,214,10,0.15)',
    textColor: Colors.semantic.warning,
    icon: 'clipboard-outline',
  },
  observer: {
    label: 'Observador',
    bgColor: 'rgba(161,161,170,0.12)',
    textColor: Colors.text.secondary,
    icon: 'eye-outline',
  },
};

const STATUS_COLOR: Record<string, string> = {
  active: Colors.semantic.success,
  pending: Colors.semantic.warning,
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
};

// ─── Componente ───────────────────────────────────────────────────────────────

interface UserRowCardProps {
  user: LeagueUser;
  onManage: (user: LeagueUser) => void;
}

function UserRowCardComponent({ user, onManage }: UserRowCardProps) {
  const roleConfig = ROLE_CONFIG[user.role];
  const statusColor = STATUS_COLOR[user.status] ?? Colors.text.disabled;
  const statusLabel = STATUS_LABEL[user.status] ?? user.status;

  // Iniciales para el avatar fallback
  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      className="rounded-2xl p-4 mb-3"
      style={{
        // style: color de fondo del design system
        backgroundColor: Colors.bg.surface1,
        borderWidth: 1,
        borderColor: Colors.bg.surface2,
      }}
    >
      <View className="flex-row items-center">
        {/* Avatar con iniciales */}
        <View
          style={{
            // style: tamaño exacto y color dinámico basado en el rol
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: roleConfig.bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.md,
          }}
        >
          <Text style={{ color: roleConfig.textColor, fontSize: theme.fontSize.sm, fontWeight: '700' }}>
            {initials}
          </Text>
        </View>

        {/* Info principal */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '600', marginBottom: 2 }}
            numberOfLines={1}
          >
            {user.name}
            {user.isCaptain && (
              <Text style={{ color: Colors.semantic.warning }}> ©</Text>
            )}
          </Text>
          <Text
            style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginBottom: 6 }}
            numberOfLines={1}
          >
            {user.email}
          </Text>
        </View>



        {/* Botón Gestionar */}
        <TouchableOpacity
          onPress={() => onManage(user)}
          activeOpacity={0.8}
          style={{
            // style: tamaño exacto y color de fondo de la acción secundaria
            marginLeft: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.borderRadius.lg,
            backgroundColor: Colors.bg.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="settings-outline" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Fila: badge de rol + estado */}
      <View className="flex-row items-center gap-3 pt-3">
        <RoleBadge
          label={roleConfig.label}
          bgColor={roleConfig.bgColor}
          textColor={roleConfig.textColor}
          icon={roleConfig.icon}
        />
        <StatusDotLabel label={statusLabel} color={statusColor} />
      </View>


      {/* Info del equipo si aplica */}
      {user.teamName && (
        <View
          className="flex-row items-center mt-3 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: Colors.bg.surface2 }}
        >
          <Ionicons name="people-outline" size={14} color={Colors.text.disabled} style={{ marginRight: 6 }} />
          <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs }}>
            {user.teamName}
            {user.jersey ? ` · #${user.jersey}` : ''}
            {user.position ? ` · ${user.position}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export const UserRowCard = memo(UserRowCardComponent);
