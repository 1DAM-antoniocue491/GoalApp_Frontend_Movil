/**
 * CreateManualMatchModal
 *
 * Modal mobile para crear un partido manual.
 * Está alineado con el modal web entregado: equipo local, equipo visitante,
 * fecha y hora. La lógica de API vive fuera del modal; este componente solo
 * valida y entrega los datos al contenedor.
 *
 * Campos antiguos como delegado, estadio y jornada se mantienen como props/data
 * opcionales para no romper llamadas existentes, pero no se muestran porque la
 * API web confirmada crea partidos con POST /partidos/ y payload mínimo.
 */

import React, { useState, useEffect } from 'react';
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
import { Button } from '@/src/shared/components/ui/Button';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateManualMatchFormData {
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  /** Compatibilidad con pantallas anteriores; no se envía si el contenedor no lo usa. */
  delegateId?: string;
  stadium?: string;
  round?: string;
}

interface CreateManualMatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateManualMatchFormData) => void;
  /** Opciones de equipos reales de la liga */
  teamOptions?: SelectOption[];
  /** Prop legacy: se conserva para no romper llamadas actuales, pero no se renderiza. */
  delegateOptions?: SelectOption[];
  /** Prop legacy: se conserva como dato opcional para el contenedor. */
  defaultRound?: string;
  /** Error del servicio para mostrar dentro del modal */
  error?: string;
  /** Indica que la llamada API está en curso */
  isSubmitting?: boolean;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateManualMatchFormData = {
  homeTeamId: '',
  awayTeamId: '',
  date: '',
  time: '',
  delegateId: '',
  stadium: '',
  round: '',
};


/**
 * El picker móvil puede devolver DD/MM/YYYY. Antes de entregar al contenedor,
 * normalizamos a YYYY-MM-DD para evitar errores de FastAPI/Pydantic.
 */
function normalizeDateForSubmit(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;

  const datePart = clean.includes('T') ? clean.split('T')[0] : clean;

  const isoMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const spanishMatch = datePart.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (spanishMatch) {
    const [, day, month, year] = spanishMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  return null;
}

/**
 * Normaliza H:m, HH:mm o HH:mm:ss a HH:mm:ss.
 */
function normalizeTimeForSubmit(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;

  const timePart = clean.includes('T') ? clean.split('T')[1] : clean;
  const timeMatch = timePart.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);

  if (timeMatch) {
    const [, rawHour, rawMinute, rawSecond = '0'] = timeMatch;
    const hour = Number(rawHour);
    const minute = Number(rawMinute);
    const second = Number(rawSecond);

    if (
      Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
      Number.isInteger(minute) && minute >= 0 && minute <= 59 &&
      Number.isInteger(second) && second >= 0 && second <= 59
    ) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}:${String(parsed.getSeconds()).padStart(2, '0')}`;
  }

  return null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CreateManualMatchModal({
  visible,
  onClose,
  onSubmit,
  teamOptions = [],
  defaultRound = '',
  error,
  isSubmitting = false,
}: CreateManualMatchModalProps) {
  const [form, setForm] = useState<CreateManualMatchFormData>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  // Pre-rellena datos internos legacy al abrir, sin mostrarlos en UI.
  useEffect(() => {
    if (visible) {
      setForm(prev => ({ ...prev, round: defaultRound }));
      setValidationError(undefined);
    }
  }, [visible, defaultRound]);

  function handleClose() {
    setForm(EMPTY_FORM);
    setValidationError(undefined);
    onClose();
  }

  function handleSubmit() {
    // Validaciones de cliente antes de llamar al servicio/API.
    if (!form.homeTeamId) {
      setValidationError('Selecciona el equipo local');
      return;
    }
    if (!form.awayTeamId) {
      setValidationError('Selecciona el equipo visitante');
      return;
    }
    if (form.homeTeamId === form.awayTeamId) {
      setValidationError('El equipo local y visitante deben ser distintos');
      return;
    }
    if (!form.date) {
      setValidationError('La fecha es obligatoria');
      return;
    }
    if (!form.time) {
      setValidationError('La hora es obligatoria');
      return;
    }

    const normalizedDate = normalizeDateForSubmit(form.date);
    const normalizedTime = normalizeTimeForSubmit(form.time);

    if (!normalizedDate || !normalizedTime) {
      setValidationError('Selecciona una fecha y hora válidas');
      return;
    }

    setValidationError(undefined);
    onSubmit({
      ...form,
      // El contenedor recibirá valores listos para construir YYYY-MM-DDTHH:mm:ss.
      date: normalizedDate,
      time: normalizedTime,
    });
  }

  const visibleError = validationError ?? error;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      {/* Overlay — toque fuera cierra el modal. */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.72)',
          justifyContent: 'flex-end',
        }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Pressable interior: evita cerrar al tocar dentro del modal. */}
          <Pressable>
            <View
              style={{
                backgroundColor: Colors.bg.surface1,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.xxl,
                maxHeight: '86%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 20,
              }}
            >
              {/* Header del modal */}
              <View className="flex-row items-center justify-between mb-2">
                <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
                  <Text
                    style={{
                      color: Colors.text.primary,
                      fontSize: theme.fontSize.xl,
                      fontWeight: '700',
                    }}
                  >
                    Nuevo partido
                  </Text>
                  <Text
                    style={{
                      color: Colors.text.secondary,
                      fontSize: theme.fontSize.sm,
                      marginTop: 4,
                      lineHeight: 20,
                    }}
                  >
                    Selecciona los equipos y programa la fecha del encuentro.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  disabled={isSubmitting}
                >
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Error de validación o API */}
              {visibleError && (
                <View
                  style={{
                    marginTop: theme.spacing.md,
                    marginBottom: theme.spacing.lg,
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: 'rgba(248,113,113,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(248,113,113,0.30)',
                  }}
                >
                  <Text style={{ color: '#F87171', fontSize: theme.fontSize.sm }}>
                    {visibleError}
                  </Text>
                </View>
              )}

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Equipo local */}
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <OptionSelectField
                    label="Equipo local"
                    value={form.homeTeamId}
                    options={teamOptions}
                    placeholder="Selecciona el equipo local"
                    onChange={v => setForm(prev => ({ ...prev, homeTeamId: v }))}
                  />
                </View>

                {/* Equipo visitante */}
                <View style={{ marginBottom: theme.spacing.xl }}>
                  <OptionSelectField
                    label="Equipo visitante"
                    value={form.awayTeamId}
                    options={teamOptions}
                    placeholder="Selecciona el equipo visitante"
                    onChange={v => setForm(prev => ({ ...prev, awayTeamId: v }))}
                  />
                </View>

                {/* Fecha y hora — selectores nativos reutilizables */}
                <View className="flex-row gap-3" style={{ marginBottom: theme.spacing.xl }}>
                  <DateTimePickerField
                    label="Fecha"
                    value={form.date}
                    mode="date"
                    icon="calendar-outline"
                    onChange={v => setForm(prev => ({ ...prev, date: v }))}
                    style={{ flex: 1.4 }}
                  />
                  <DateTimePickerField
                    label="Hora"
                    value={form.time}
                    mode="time"
                    icon="time-outline"
                    onChange={v => setForm(prev => ({ ...prev, time: v }))}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>

              {/* Footer de acciones */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Button
                    label="Cancelar"
                    variant="secondary"
                    onPress={handleClose}
                    disabled={isSubmitting}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={isSubmitting ? 'Guardando...' : 'Guardar partido'}
                    variant="primary"
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
