/**
 * EditScheduledMatchModal.tsx
 * Modal RN + NativeWind para editar partidos programados.
 * Usa el mismo DateTimePickerField que la creación de partido.
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';
import type { EditableScheduledMatchStatus, PartidoApi } from '../../types/matches.types';
import {
  buildBackendCivilDateTime,
  getAwayTeamName,
  getHomeTeamName,
  getMatchDate,
  normalizeMatchStatus,
} from '../../services/matchesService';

export interface EditScheduledMatchData {
  fecha: string;
  estado: EditableScheduledMatchStatus;
}

interface EditScheduledMatchModalProps {
  visible: boolean;
  match: PartidoApi | null;
  saving?: boolean;
  onConfirm: (data: EditScheduledMatchData) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: EditableScheduledMatchStatus; label: string; description: string }[] = [
  { value: 'programado', label: 'Programado', description: 'Mantener el partido activo en calendario' },
  { value: 'cancelado', label: 'Cancelado', description: 'No se jugará este partido' },
  { value: 'suspendido', label: 'Suspendido', description: 'Partido aplazado o detenido por incidencia' },
];

function formatDateForPicker(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function formatTimeForPicker(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function toPickerDateTime(raw?: string | null): { date: string; time: string } {
  if (!raw) return { date: '', time: '' };
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return { date: formatDateForPicker(parsed), time: formatTimeForPicker(parsed) };
  }

  const fallback = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (fallback) {
    const [, year, month, day, hour = '00', minute = '00'] = fallback;
    return { date: `${day}/${month}/${year}`, time: `${hour}:${minute}` };
  }

  return { date: '', time: '' };
}

function isValidPickerDate(value: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function EditScheduledMatchModalComponent({
  visible,
  match,
  saving = false,
  onConfirm,
  onCancel,
}: EditScheduledMatchModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<EditableScheduledMatchStatus>('programado');

  useEffect(() => {
    if (!visible || !match) return;
    const next = toPickerDateTime(getMatchDate(match));
    setDate(next.date);
    setTime(next.time);

    const currentStatus = normalizeMatchStatus(match.estado);
    setStatus(currentStatus === 'cancelado' || currentStatus === 'suspendido' ? currentStatus : 'programado');
  }, [visible, match]);

  const error = useMemo(() => {
    if (!date || !time) return 'La fecha y la hora son obligatorias.';
    if (!isValidPickerDate(date)) return 'Selecciona una fecha válida.';
    if (!isValidTime(time)) return 'Selecciona una hora válida.';
    return null;
  }, [date, time]);

  const handleConfirm = () => {
    if (error || saving) return;
    onConfirm({
      // Regla del proyecto: se restan 2h antes de enviar al backend.
      fecha: buildBackendCivilDateTime(date, time, { subtractHours: 2, appendZ: true }),
      estado: status,
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={saving ? () => undefined : onCancel}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
        <Pressable className="flex-1" onPress={saving ? undefined : onCancel} />
        <View
          className="px-6 pt-4"
          style={{
            backgroundColor: Colors.bg.surface1,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingBottom: 40,
            maxHeight: '90%',
          }}
        >
          <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: Colors.bg.surface2, alignSelf: 'center', marginBottom: 18 }} />

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="create-outline" size={21} color={Colors.brand.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: '900' }}>Editar partido</Text>
                {match ? (
                  <Text numberOfLines={1} style={{ color: Colors.text.secondary, marginTop: 2 }}>
                    {getHomeTeamName(match)} vs {getAwayTeamName(match)}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="flex-row" style={{ gap: 12, marginTop: 22 }}>
              <DateTimePickerField
                label="Fecha"
                value={date}
                mode="date"
                icon="calendar-outline"
                onChange={setDate}
              />
              <DateTimePickerField
                label="Hora"
                value={time}
                mode="time"
                icon="time-outline"
                onChange={setTime}
              />
            </View>

            <Text style={{ color: Colors.text.secondary, marginTop: 18, marginBottom: 10, fontWeight: '800' }}>
              Estado permitido
            </Text>
            <View style={{ gap: 10 }}>
              {STATUS_OPTIONS.map(option => {
                const active = status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    disabled={saving}
                    onPress={() => setStatus(option.value)}
                    activeOpacity={0.9}
                    style={{
                      borderRadius: theme.borderRadius.lg,
                      backgroundColor: active ? Colors.brand.primary + '20' : Colors.bg.surface2,
                      borderWidth: 1,
                      borderColor: active ? Colors.brand.primary : 'transparent',
                      padding: 14,
                      opacity: saving ? 0.55 : 1,
                    }}
                  >
                    <Text style={{ color: active ? Colors.brand.primary : Colors.text.primary, fontWeight: '900' }}>
                      {option.label}
                    </Text>
                    <Text style={{ color: Colors.text.secondary, marginTop: 3, fontSize: 12 }}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error ? <Text style={{ color: Colors.semantic.warning, marginTop: 14 }}>{error}</Text> : null}

            <View className="flex-row" style={{ gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                disabled={saving}
                onPress={onCancel}
                style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2, opacity: saving ? 0.6 : 1 }}
              >
                <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={Boolean(error) || saving}
                onPress={handleConfirm}
                style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: !error && !saving ? Colors.brand.primary : Colors.bg.surface2 }}
              >
                <Text style={{ color: !error && !saving ? Colors.bg.base : Colors.text.disabled, fontWeight: '900' }}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const EditScheduledMatchModal = memo(EditScheduledMatchModalComponent);
