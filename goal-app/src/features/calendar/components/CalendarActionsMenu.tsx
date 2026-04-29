/**
 * CalendarActionsMenu.tsx
 *
 * Bottom sheet de acciones del calendario que se abre desde el
 * icono de menú del CalendarHeader.
 *
 * Solo muestra las acciones que el rol actual puede realizar.
 * Las acciones abren los modales correspondientes en CalendarScreen.
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

interface CalendarActionsMenuProps {
  visible: boolean;
  permissions: CalendarPermissions;
  onClose: () => void;
  onCreateCalendar: () => void;
  onEditCalendar: () => void;
  onAddMatch: () => void;
}

interface ActionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  /** Si true, muestra separador inferior */
  divider?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-componente: item de acción
// ---------------------------------------------------------------------------

function ActionItem({ icon, label, description, onPress, divider = false }: ActionItemProps) {
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
            backgroundColor: Colors.bg.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={20} color={Colors.text.primary} />
        </View>

        {/* Texto */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '600' }}>
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
  onClose,
  onCreateCalendar,
  onEditCalendar,
  onAddMatch,
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

  // Si no hay ninguna acción disponible, no renderizar
  const hasActions =
    permissions.canCreateCalendar ||
    permissions.canEditCalendar ||
    permissions.canAddMatch;

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
              marginBottom: 20,
            }}
          >
            Elige una acción para continuar
          </Text>

          {/* Acciones */}
          {permissions.canCreateCalendar && (
            <ActionItem
              icon="calendar-outline"
              label="Crear calendario"
              description="Genera el calendario automático de la liga"
              onPress={onCreateCalendar}
              divider={permissions.canEditCalendar || permissions.canAddMatch}
            />
          )}
          {permissions.canEditCalendar && (
            <ActionItem
              icon="create-outline"
              label="Editar calendario"
              description="Modifica la configuración del calendario"
              onPress={onEditCalendar}
              divider={permissions.canAddMatch}
            />
          )}
          {permissions.canAddMatch && (
            <ActionItem
              icon="add-circle-outline"
              label="Nuevo partido"
              description="Añade un partido manualmente a la jornada"
              onPress={onAddMatch}
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
