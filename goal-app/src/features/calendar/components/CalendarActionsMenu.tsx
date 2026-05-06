/**
 * CalendarActionsMenu.tsx
 *
 * Bottom sheet de acciones del calendario que se abre desde el
 * icono de menú del CalendarHeader.
 *
 * Las acciones disponibles dependen del rol, del estado del calendario
 * y de si existe un calendario generado por el modal de crear calendario:
 * - sin calendario generado: Crear calendario / Nuevo partido / Nuevo equipo
 * - calendario generado editable: Editar calendario / Eliminar calendario / Nuevo partido
 * - locked: acciones no destructivas mientras haya partidos en juego/finalizados
 *
 * IMPORTANTE:
 * Los partidos manuales NO habilitan "Editar calendario". Esa opción solo
 * debe aparecer cuando existe calendario automático/generado por la API.
 */

import React, { useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { CalendarPermissions } from '../types/calendar.types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Estado del calendario — controla bloqueos y acciones disponibles */
export type CalendarMenuState = 'no_calendar' | 'editable' | 'locked';

interface CalendarActionsMenuProps {
  visible: boolean;
  permissions: CalendarPermissions;
  /** Estado del calendario para condicionar las acciones disponibles */
  calendarMenuState: CalendarMenuState;
  /**
   * True solo cuando el calendario fue generado desde el modal/API de crear calendario.
   * Los partidos manuales NO cuentan como calendario generado y no deben habilitar editar/eliminar calendario.
   */
  hasGeneratedCalendar?: boolean;
  onClose: () => void;
  onCreateCalendar: () => void;
  onEditCalendar: () => void;
  onDeleteCalendar: () => void;
  onAddMatch: () => void;
  /** Abre CreateTeamModal desde el menú — solo admin */
  onAddTeam?: () => void;
}

interface ActionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  /** Si true, muestra separador inferior */
  divider?: boolean;
  /** Variante visual para acciones destructivas */
  destructive?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-componente: item de acción
// ---------------------------------------------------------------------------

function ActionItem({ icon, label, description, onPress, divider = false, destructive = false }: ActionItemProps) {
  const iconColor = destructive ? Colors.semantic.error : Colors.text.primary;
  const labelColor = destructive ? Colors.semantic.error : Colors.text.primary;
  const bgColor = destructive ? `${Colors.semantic.error}18` : Colors.bg.surface2;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 14,
        }}
      >
        {/* Icono con fondo tintado */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>

        {/* Texto */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: labelColor, fontSize: theme.fontSize.md, fontWeight: '600' }}>
            {label}
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 2 }}>
            {description}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.text.disabled} />
      </TouchableOpacity>

      {divider && (
        <View style={{ height: 1, backgroundColor: Colors.bg.surface2 }} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function CalendarActionsMenuComponent({
  visible,
  permissions,
  calendarMenuState,
  hasGeneratedCalendar = false,
  onClose,
  onCreateCalendar,
  onEditCalendar,
  onDeleteCalendar,
  onAddMatch,
  onAddTeam,
}: CalendarActionsMenuProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  const isLocked = calendarMenuState === 'locked';

  // Acciones disponibles según estado y permisos.
  // Regla clave: editar/eliminar calendario solo aparece si existe calendario generado.
  // Si solo hay partidos manuales, sigue pudiéndose crear calendario automático,
  // pero no editar una configuración que todavía no existe.
  const canCreate = permissions.canCreateCalendar && !hasGeneratedCalendar && !isLocked;
  const canEdit = permissions.canEditCalendar && hasGeneratedCalendar && calendarMenuState === 'editable';
  const canDelete = permissions.canEditCalendar && hasGeneratedCalendar && calendarMenuState === 'editable';
  const canAddMatch = permissions.canAddMatch;
  const hasActions = canCreate || canEdit || canDelete || canAddMatch || !!onAddTeam;

  if (!hasActions) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.6)',
          opacity: opacityAnim,
        }}
      >
        {/* Overlay para cerrar */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: Colors.bg.surface1,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 40,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.bg.surface2,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          {/* Título */}
          <Text
            style={{
              color: Colors.text.primary,
              fontSize: theme.fontSize.lg,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            Gestionar calendario
          </Text>
          <Text
            style={{
              color: Colors.text.secondary,
              fontSize: theme.fontSize.xs,
              marginBottom: isLocked ? 12 : 20,
            }}
          >
            {hasGeneratedCalendar
              ? 'Elige una acción para continuar'
              : 'Aún no hay calendario generado; los partidos manuales se mantienen aparte'}
          </Text>

          {/* Banner de calendario bloqueado */}
          {isLocked && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: `${Colors.semantic.warning}18`,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: `${Colors.semantic.warning}40`,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 20,
              }}
            >
              <Ionicons name="lock-closed-outline" size={16} color={Colors.semantic.warning} />
              <Text style={{ color: Colors.semantic.warning, fontSize: 12, flex: 1, lineHeight: 16 }}>
                El calendario está bloqueado mientras hay partidos en juego o finalizados.
              </Text>
            </View>
          )}

          {/* Acciones según estado del calendario */}
          {canCreate && (
            <ActionItem
              icon="calendar-outline"
              label="Crear calendario"
              description="Genera el calendario automático sin depender de partidos manuales"
              onPress={onCreateCalendar}
              divider={canAddMatch || !!onAddTeam}
            />
          )}
          {canEdit && (
            <ActionItem
              icon="create-outline"
              label="Editar calendario"
              description="Modifica la configuración del calendario"
              onPress={onEditCalendar}
              divider={canDelete || canAddMatch}
            />
          )}
          {canDelete && (
            <ActionItem
              icon="trash-outline"
              label="Eliminar calendario"
              description="Elimina todos los partidos y jornadas"
              onPress={onDeleteCalendar}
              divider={canAddMatch || !!onAddTeam}
              destructive
            />
          )}
          {canAddMatch && (
            <ActionItem
              icon="add-circle-outline"
              label="Nuevo partido"
              description="Añade un partido manualmente a la jornada"
              onPress={onAddMatch}
              divider={!!onAddTeam}
            />
          )}
          {onAddTeam && (
            <ActionItem
              icon="shield-outline"
              label="Nuevo equipo"
              description="Crea un equipo en la liga actual"
              onPress={onAddTeam}
            />
          )}

          {/* Cancelar */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              marginTop: 16,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.md, fontWeight: '500' }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export const CalendarActionsMenu = memo(CalendarActionsMenuComponent);
