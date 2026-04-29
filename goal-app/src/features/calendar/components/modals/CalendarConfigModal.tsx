/**
 * CalendarConfigModal.tsx
 *
 * Modal para crear o editar el calendario de la liga.
 *
 * mode === 'create': genera un nuevo calendario automático.
 * mode === 'edit':   modifica la configuración del calendario existente.
 *
 * Campos:
 * - Tipo: Solo ida / Ida y vuelta
 * - Fecha de inicio
 * - Días de partido (multi-selección)
 * - Hora de los partidos
 *
 * PREPARADO PARA API:
 * onConfirm recibe CalendarConfigData listo para enviar a
 * POST /calendar/generate o PATCH /calendar/:id/config.
 */

import React, { useRef, useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type CalendarType = 'one_way' | 'two_way';

export interface CalendarConfigData {
  /** Solo ida o ida y vuelta */
  type: CalendarType;
  /** Formato DD/MM/AAAA */
  startDate: string;
  /** Índices de los días: 0=Lun, 1=Mar, ..., 6=Dom */
  matchDays: number[];
  /** Formato HH:MM */
  matchTime: string;
}

interface CalendarConfigModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  /** Datos iniciales para rellenar el formulario en modo edición */
  initialData?: Partial<CalendarConfigData>;
  onConfirm: (data: CalendarConfigData) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const TYPE_OPTIONS: { value: CalendarType; label: string; description: string }[] = [
  { value: 'one_way', label: 'Solo ida', description: 'Cada equipo juega una vez de local' },
  { value: 'two_way', label: 'Ida y vuelta', description: 'Cada equipo juega dos veces de local' },
];

// ---------------------------------------------------------------------------
// Sub-componente: selector de tipo de calendario (pill toggle)
// ---------------------------------------------------------------------------

function TypeSelector({
  value,
  onChange,
}: {
  value: CalendarType;
  onChange: (v: CalendarType) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      {TYPE_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: isSelected
                ? `${Colors.brand.primary}18`
                : Colors.bg.surface2,
              borderWidth: 1.5,
              borderColor: isSelected ? Colors.brand.primary : 'transparent',
            }}
          >
            {/* Radio indicator */}
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: isSelected ? Colors.brand.primary : Colors.text.disabled,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelected && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: Colors.brand.primary,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: isSelected ? Colors.text.primary : Colors.text.secondary,
                  fontSize: theme.fontSize.md,
                  fontWeight: isSelected ? '700' : '400',
                }}
              >
                {opt.label}
              </Text>
              <Text style={{ color: Colors.text.disabled, fontSize: 12, marginTop: 2 }}>
                {opt.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: selector de días de la semana
// ---------------------------------------------------------------------------

function DaySelector({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (index: number) => {
    if (selected.includes(index)) {
      onChange(selected.filter((d) => d !== index));
    } else {
      onChange([...selected, index].sort((a, b) => a - b));
    }
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {DAYS_LABELS.map((label, i) => {
        const active = selected.includes(i);
        return (
          <Pressable
            key={i}
            onPress={() => toggle(i)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: theme.borderRadius.full,
              backgroundColor: active ? Colors.brand.primary : Colors.bg.surface2,
              borderWidth: 1,
              borderColor: active ? 'transparent' : Colors.bg.surface2,
            }}
          >
            <Text
              style={{
                color: active ? Colors.bg.base : Colors.text.secondary,
                fontSize: 13,
                fontWeight: active ? '700' : '400',
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: label de sección
// ---------------------------------------------------------------------------

function FieldLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        color: Colors.text.secondary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {label}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function CalendarConfigModalComponent({
  visible,
  mode,
  initialData,
  onConfirm,
  onCancel,
}: CalendarConfigModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Estado del formulario
  const [calType, setCalType] = useState<CalendarType>(initialData?.type ?? 'two_way');
  const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
  const [matchDays, setMatchDays] = useState<number[]>(initialData?.matchDays ?? [5, 6]); // Sáb/Dom por defecto
  const [matchTime, setMatchTime] = useState(initialData?.matchTime ?? '');

  // Resetear al abrir en modo creación
  useEffect(() => {
    if (visible && mode === 'create' && !initialData) {
      setCalType('two_way');
      setStartDate('');
      setMatchDays([5, 6]);
      setMatchTime('');
    }
  }, [visible, mode, initialData]);

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
          duration: 300,
          easing: Easing.out(Easing.back(1.0)),
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
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  const isValid = startDate.length > 0 && matchDays.length > 0 && matchTime.length > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm({ type: calType, startDate, matchDays, matchTime });
  };

  const isCreate = mode === 'create';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.65)',
            opacity: opacityAnim,
          }}
        >
          {/* Overlay para cerrar */}
          <Pressable style={{ flex: 1 }} onPress={onCancel} />

          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              backgroundColor: Colors.bg.surface1,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 12,
              paddingBottom: 40,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
              maxHeight: '90%',
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

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                marginBottom: 24,
              }}
            >
              <View>
                <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: '700' }}>
                  {isCreate ? 'Crear calendario' : 'Editar calendario'}
                </Text>
                <Text style={{ color: Colors.text.secondary, fontSize: 13, marginTop: 4 }}>
                  {isCreate
                    ? 'Configura el calendario de la temporada'
                    : 'Modifica la configuración actual'}
                </Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Colors.bg.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color={Colors.text.secondary} />
              </Pressable>
            </View>

            {/* Formulario en scroll */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 24, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tipo de calendario */}
              <View>
                <FieldLabel label="Tipo de calendario" />
                <TypeSelector value={calType} onChange={setCalType} />
              </View>

              {/* Fecha de inicio */}
              <View>
                <FieldLabel label="Fecha de inicio" />
                <DateTimePickerField
                  label=""
                  value={startDate}
                  mode="date"
                  onChange={setStartDate}
                  icon="calendar-outline"
                />
              </View>

              {/* Días de partido */}
              <View>
                <FieldLabel label="Días de partido" />
                <DaySelector selected={matchDays} onChange={setMatchDays} />
                {matchDays.length === 0 && (
                  <Text style={{ color: Colors.semantic.error, fontSize: 12, marginTop: 6 }}>
                    Selecciona al menos un día
                  </Text>
                )}
              </View>

              {/* Hora de los partidos */}
              <View>
                <FieldLabel label="Hora de inicio" />
                <DateTimePickerField
                  label=""
                  value={matchTime}
                  mode="time"
                  onChange={setMatchTime}
                  icon="time-outline"
                />
              </View>
            </ScrollView>

            {/* Botones fuera del scroll para que siempre sean visibles */}
            <View style={{ paddingHorizontal: 24, paddingTop: 20, gap: 10 }}>
              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.88}
                disabled={!isValid}
                style={{
                  height: 56,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isValid ? Colors.brand.primary : Colors.bg.surface2,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons
                  name={isCreate ? 'calendar' : 'checkmark-circle'}
                  size={18}
                  color={isValid ? Colors.bg.base : Colors.text.disabled}
                />
                <Text
                  style={{
                    color: isValid ? Colors.bg.base : Colors.text.disabled,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  {isCreate ? 'Crear calendario' : 'Guardar cambios'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onCancel}
                activeOpacity={0.7}
                style={{ paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '500' }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const CalendarConfigModal = memo(CalendarConfigModalComponent);
