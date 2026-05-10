/**
 * EditScheduledMatchModal
 * Usa el mismo DateTimePickerField que creación de partido.
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';
import type { EditableScheduledMatchStatus, PartidoApi } from '../../types/matches.types';
import { getAwayTeamName, getHomeTeamName, getMatchDate, normalizeMatchStatus, parseBackendDateTimeLiteral } from '../../services/matchesService';
import { MatchModalActions, MatchModalButton, MatchModalShell } from './MatchModalShell';
import { FieldTitle } from './matchEventModalHelpers';

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

const STATUS_OPTIONS: Array<{ value: EditableScheduledMatchStatus; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'programado', label: 'Programado', description: 'Mantener el partido activo en calendario', icon: 'calendar-outline' },
  { value: 'cancelado', label: 'Cancelado', description: 'No se jugará este partido', icon: 'close-circle-outline' },
  { value: 'suspendido', label: 'Suspendido', description: 'Queda detenido o aplazado por incidencia', icon: 'pause-circle-outline' },
];

function isoToPickerDate(raw?: string | null): string {
  const parts = parseBackendDateTimeLiteral(raw);
  if (!parts.date) return '';
  const [year, month, day] = parts.date.split('-');
  return `${day}/${month}/${year}`;
}

function pickerDateToIso(value: string): string | null {
  const clean = value.trim();
  const spanish = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (spanish) {
    const [, day, month, year] = spanish;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const iso = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

function isValidTime(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function EditScheduledMatchModalComponent({ visible, match, saving = false, onConfirm, onCancel }: EditScheduledMatchModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<EditableScheduledMatchStatus>('programado');

  useEffect(() => {
    if (!visible || !match) return;
    const raw = getMatchDate(match);
    const parts = parseBackendDateTimeLiteral(raw);
    setDate(isoToPickerDate(raw));
    setTime(parts.time || '');

    const current = normalizeMatchStatus(match.estado);
    setStatus(current === 'cancelado' || current === 'suspendido' ? current : 'programado');
  }, [visible, match]);

  const error = useMemo(() => {
    if (!date || !time) return 'La fecha y la hora son obligatorias.';
    if (!pickerDateToIso(date)) return 'Selecciona una fecha válida.';
    if (!isValidTime(time)) return 'Selecciona una hora válida.';
    return null;
  }, [date, time]);

  const handleConfirm = () => {
    const isoDate = pickerDateToIso(date);
    if (!isoDate || error || saving) return;
    onConfirm({ fecha: `${isoDate}T${time}:00`, estado: status });
  };

  return (
    <MatchModalShell
      visible={visible}
      title="Editar partido"
      subtitle={match ? `${getHomeTeamName(match)} vs ${getAwayTeamName(match)}` : null}
      icon="create-outline"
      pending={saving}
      onClose={onCancel}
      footer={
        <MatchModalActions>
          <MatchModalButton label="Cancelar" variant="secondary" disabled={saving} onPress={onCancel} />
          <MatchModalButton label="Guardar" variant="primary" loading={saving} disabled={Boolean(error) || saving} onPress={handleConfirm} />
        </MatchModalActions>
      }
    >
      <View className="flex-row" style={{ gap: 12 }}>
        <DateTimePickerField label="Fecha" value={date} mode="date" icon="calendar-outline" onChange={setDate} />
        <DateTimePickerField label="Hora" value={time} mode="time" icon="time-outline" onChange={setTime} />
      </View>

      <View style={{ marginTop: 20 }}>
        <FieldTitle>Estado permitido</FieldTitle>
        <View style={{ gap: 10 }}>
          {STATUS_OPTIONS.map((option) => {
            const active = status === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                disabled={saving}
                onPress={() => setStatus(option.value)}
                activeOpacity={0.9}
                className="flex-row items-center"
                style={{
                  borderRadius: 16,
                  backgroundColor: active ? `${Colors.brand.primary}20` : Colors.bg.surface2,
                  borderWidth: 1,
                  borderColor: active ? Colors.brand.primary : 'transparent',
                  padding: 14,
                  gap: 12,
                  opacity: saving ? 0.55 : 1,
                }}
              >
                <Ionicons name={option.icon} size={22} color={active ? Colors.brand.primary : Colors.text.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: active ? Colors.brand.primary : Colors.text.primary, fontWeight: '900' }}>{option.label}</Text>
                  <Text style={{ color: Colors.text.secondary, marginTop: 3, fontSize: 12 }}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {error ? <Text style={{ color: Colors.semantic.warning, marginTop: 14, fontWeight: '700' }}>{error}</Text> : null}
    </MatchModalShell>
  );
}

export const EditScheduledMatchModal = memo(EditScheduledMatchModalComponent);
