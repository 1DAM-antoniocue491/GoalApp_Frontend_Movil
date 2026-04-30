/**
 * CreateManualMatchModal
 *
 * Modal slide-up para crear un partido manual dentro de una liga.
 * A diferencia de los partidos generados por calendario, aquí el usuario
 * elige libremente ambos equipos y todos los datos del encuentro.
 *
 * Campos: equipo local, equipo visitante, delegado, fecha, hora, estadio.
 *
 * Reutiliza:
 * - OptionSelectField (shared/components/ui) → selects de equipos y delegado
 * - Button (shared/components/ui) → footer Cancelar / Guardar partido
 * - Colors (shared/constants/colors) → valores del design system
 * - theme (shared/styles/theme) → spacing, borderRadius, fontSize
 * - styles (shared/styles) → inputRow, input, label, inputPlaceholder, inputIcon
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
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
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateManualMatchFormData {
  homeTeamId: string;
  awayTeamId: string;
  delegateId: string;
  date: string;
  time: string;
  stadium: string;
  round: string;
}

interface CreateManualMatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateManualMatchFormData) => void;
  /** Opciones de equipos disponibles en la liga */
  teamOptions?: SelectOption[];
  /** Opciones de delegados disponibles en la liga */
  delegateOptions?: SelectOption[];
  /** Jornada activa — pre-rellena el campo al abrir el modal */
  defaultRound?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

// Mocks temporales hasta conectar con el servicio real
const DEFAULT_TEAM_OPTIONS: SelectOption[] = [
  { value: 'team_1', label: 'Real Madrid CF' },
  { value: 'team_2', label: 'FC Barcelona' },
  { value: 'team_3', label: 'Atlético de Madrid' },
  { value: 'team_4', label: 'Sevilla FC' },
];

const DEFAULT_DELEGATE_OPTIONS: SelectOption[] = [
  { value: 'del_1', label: 'Carlos Martínez' },
  { value: 'del_2', label: 'Ana García' },
  { value: 'del_3', label: 'Luis Rodríguez' },
];

const EMPTY_FORM: CreateManualMatchFormData = {
  homeTeamId: '',
  awayTeamId: '',
  delegateId: '',
  date: '',
  time: '',
  stadium: '',
  round: '',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function CreateManualMatchModal({
  visible,
  onClose,
  onSubmit,
  teamOptions = DEFAULT_TEAM_OPTIONS,
  delegateOptions = DEFAULT_DELEGATE_OPTIONS,
  defaultRound = '',
}: CreateManualMatchModalProps) {
  const [form, setForm] = useState<CreateManualMatchFormData>(EMPTY_FORM);

  // Pre-rellena la jornada cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setForm(prev => ({ ...prev, round: defaultRound }));
    }
  }, [visible, defaultRound]);

  function handleClose() {
    // Limpia el form al cerrar para que no persista al reabrirse
    setForm(EMPTY_FORM);
    onClose();
  }

  function handleSubmit() {
    onSubmit(form);
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
                // style: borderRadius solo en esquinas superiores — no existe clase Tailwind para esto
                backgroundColor: Colors.bg.surface1,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.xxl,
                // style: sombra elevada para separar visualmente del overlay
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
                  Nuevo partido
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Subtítulo */}
              <Text
                style={{
                  color: Colors.text.secondary,
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.xl,
                  lineHeight: 20,
                }}
              >
                Partido manual — puedes elegir todos los datos del encuentro.
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >

                {/* ── Equipo local ── */}
                {/* OptionSelectField abre su propio modal de selección internamente */}
                <View className="mb-4">
                  <OptionSelectField
                    label="Equipo local"
                    value={form.homeTeamId}
                    options={teamOptions}
                    placeholder="Selecciona el equipo local"
                    onChange={v => setForm(prev => ({ ...prev, homeTeamId: v }))}
                  />
                </View>

                {/* ── Equipo visitante ── */}
                <View className="mb-5">
                  <OptionSelectField
                    label="Equipo visitante"
                    value={form.awayTeamId}
                    options={teamOptions}
                    placeholder="Selecciona el equipo visitante"
                    onChange={v => setForm(prev => ({ ...prev, awayTeamId: v }))}
                  />
                </View>

                {/* ── Delegado del campo ── */}
                <View className="mb-5">
                  <OptionSelectField
                    label="Delegado del campo"
                    value={form.delegateId}
                    options={delegateOptions}
                    placeholder="Selecciona el delegado"
                    onChange={v => setForm(prev => ({ ...prev, delegateId: v }))}
                  />
                </View>

                {/* ── Fila: Fecha + Hora — selectores nativos ── */}
                <View className="flex-row gap-3 mb-4">
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
                  />
                </View>

                {/* ── Estadio ── */}
                <View className="mb-4">
                  <Text className={styles.label} style={{ marginBottom: 6 }}>
                    Estadio
                  </Text>
                  <View className={styles.inputRow}>
                    <View className={styles.inputIcon}>
                      <Ionicons name="location-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={styles.input}
                      placeholder="Nombre del estadio"
                      placeholderTextColor={styles.inputPlaceholder}
                      value={form.stadium}
                      onChangeText={v => setForm(prev => ({ ...prev, stadium: v }))}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* ── Jornada ── */}
                <View className="mb-6">
                  <Text className={styles.label} style={{ marginBottom: 6 }}>
                    Jornada
                  </Text>
                  <View className={styles.inputRow}>
                    <View className={styles.inputIcon}>
                      <Ionicons name="list-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={styles.input}
                      placeholder="Ej: Jornada 10"
                      placeholderTextColor={styles.inputPlaceholder}
                      value={form.round}
                      onChangeText={v => setForm(prev => ({ ...prev, round: v }))}
                      returnKeyType="done"
                    />
                  </View>
                </View>

              </ScrollView>

              {/* ── Footer ── */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={handleClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Guardar partido" variant="primary" onPress={handleSubmit} />
                </View>
              </View>

            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
