/**
 * CreateCalendarModal
 *
 * Modal slide-up para generar el calendario de una liga automáticamente.
 * El usuario configura: tipo (solo ida / ida y vuelta), fecha de inicio,
 * días de partido y hora. El backend genera los cruces a partir de estos datos.
 *
 * Reutiliza:
 * - Button (shared/components/ui) → Cancelar y Guardar calendario
 * - Colors (shared/constants/colors) → valores de color del design system
 * - theme (shared/styles/theme) → spacing, borderRadius, fontSize
 * - styles (shared/styles) → inputRow, input, label, inputPlaceholder, inputIcon
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles } from '@/src/shared/styles';
import { Button } from '@/src/shared/components/ui/Button';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type CalendarType = 'one_way' | 'both_ways';

interface CreateCalendarFormData {
  type: CalendarType;
  startDate: string;
  matchDays: string[];
  matchTime: string;
}

interface CreateCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCalendarFormData) => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

const CALENDAR_TYPES: { value: CalendarType; label: string; hint: string }[] = [
  { value: 'one_way', label: 'Solo ida', hint: 'Cada cruce se juega una vez' },
  { value: 'both_ways', label: 'Ida y vuelta', hint: 'Cada cruce se juega dos veces' },
];

const EMPTY_FORM: CreateCalendarFormData = {
  type: 'one_way',
  startDate: '',
  matchDays: [],
  matchTime: '',
};

// ─── Componente ──────────────────────────────────────────────────────────────

export function CreateCalendarModal({ visible, onClose, onSubmit }: CreateCalendarModalProps) {
  const [form, setForm] = useState<CreateCalendarFormData>(EMPTY_FORM);

  function handleClose() {
    // Limpia el form al cerrar para que no persista al reabrirse
    setForm(EMPTY_FORM);
    onClose();
  }

  function handleSubmit() {
    onSubmit(form);
  }

  // Alterna la selección de un día de partido
  function toggleDay(day: string) {
    setForm(prev => ({
      ...prev,
      matchDays: prev.matchDays.includes(day)
        ? prev.matchDays.filter(d => d !== day)
        : [...prev.matchDays, day],
    }));
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      {/* Overlay — toque fuera cierra el modal */}
      <Pressable
        style={{
          // style: backgroundColor con alpha no tiene clase Tailwind directa
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.70)',
          justifyContent: 'flex-end',
        }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Pressable interior sin onPress: consume el toque, evita cerrar al tocar dentro */}
          <Pressable>
            <View
              style={{
                // style: borderRadius solo en esquinas superiores — no hay clase Tailwind para esto
                backgroundColor: Colors.bg.surface1,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.xxl,
                // style: sombra elevada para separar del overlay
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 20,
              }}
            >
              {/* ── Header ── */}
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  style={{
                    color: Colors.text.primary,
                    fontSize: theme.fontSize.xl,
                    fontWeight: '700',
                  }}
                >
                  Crear calendario
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Descripción */}
              <Text
                style={{
                  color: Colors.text.secondary,
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.xl,
                  lineHeight: 20,
                }}
              >
                Genera los partidos de la liga de forma automática.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── Tipo de calendario ── */}
                <View className="mb-5">
                  <Text className={styles.label} style={{ marginBottom: 10 }}>
                    Tipo de calendario
                  </Text>
                  {/* Dos cards horizontales: la seleccionada resalta con borde brand */}
                  <View className="flex-row gap-3">
                    {CALENDAR_TYPES.map(option => {
                      const isSelected = form.type === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setForm(prev => ({ ...prev, type: option.value }))}
                          activeOpacity={0.8}
                          style={{
                            // style: borde y fondo cambian dinámicamente según selección
                            flex: 1,
                            backgroundColor: isSelected
                              ? 'rgba(200,245,88,0.08)'
                              : Colors.bg.surface2,
                            borderRadius: theme.borderRadius.lg,
                            borderWidth: 1.5,
                            borderColor: isSelected ? Colors.brand.primary : Colors.bg.surface2,
                            padding: theme.spacing.md,
                            gap: 4,
                          }}
                        >
                          <Text
                            style={{
                              // style: color dinámico según selección
                              color: isSelected ? Colors.brand.primary : Colors.text.primary,
                              fontSize: theme.fontSize.sm,
                              fontWeight: '600',
                            }}
                          >
                            {option.label}
                          </Text>
                          <Text
                            style={{
                              color: Colors.text.disabled,
                              fontSize: theme.fontSize.xs,
                              lineHeight: 16,
                            }}
                          >
                            {option.hint}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* ── Fecha de inicio — selector nativo ── */}
                <View className="mb-5">
                  <DateTimePickerField
                    label="Fecha de inicio"
                    value={form.startDate}
                    mode="date"
                    icon="calendar-outline"
                    onChange={v => setForm(prev => ({ ...prev, startDate: v }))}
                  />
                </View>

                {/* ── Días de partido ── */}
                <View className="mb-5">
                  <Text className={styles.label} style={{ marginBottom: 10 }}>
                    Días de partido
                  </Text>
                  {/* Chips toggleables: uno por día de la semana */}
                  <View className="flex-row gap-2">
                    {WEEK_DAYS.map(day => {
                      const isActive = form.matchDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => toggleDay(day)}
                          activeOpacity={0.75}
                          style={{
                            // style: tamaño exacto cuadrado y color dinámico según estado
                            flex: 1,
                            height: 38,
                            borderRadius: theme.borderRadius.md,
                            backgroundColor: isActive ? Colors.brand.primary : Colors.bg.surface2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              // style: color dinámico según estado del chip
                              color: isActive ? '#000000' : Colors.text.secondary,
                              fontSize: theme.fontSize.xs,
                              fontWeight: '700',
                            }}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* ── Hora de los partidos — selector nativo ── */}
                <View className="mb-6">
                  <DateTimePickerField
                    label="Hora de los partidos"
                    value={form.matchTime}
                    mode="time"
                    icon="time-outline"
                    onChange={v => setForm(prev => ({ ...prev, matchTime: v }))}
                  />
                </View>

              </ScrollView>

              {/* ── Footer ── */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={handleClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Guardar calendario" variant="primary" onPress={handleSubmit} />
                </View>
              </View>

            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
