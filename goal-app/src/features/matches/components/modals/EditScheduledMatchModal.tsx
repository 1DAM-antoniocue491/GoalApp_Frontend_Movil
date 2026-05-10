/**
 * EditScheduledMatchModal.tsx
 * Edición segura de partidos programados.
 * Solo permite mantener programado, cancelar o suspender.
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { EditableScheduledMatchStatus, PartidoApi } from '../../types/matches.types';
import { getAwayTeamName, getHomeTeamName, getMatchDate, normalizeMatchStatus } from '../../services/matchesService';

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

const STATUS_OPTIONS: Array<{ value: EditableScheduledMatchStatus; label: string; description: string }> = [
  { value: 'programado', label: 'Programado', description: 'Mantener el partido activo en calendario' },
  { value: 'cancelado', label: 'Cancelado', description: 'No se jugará este partido' },
  { value: 'suspendido', label: 'Suspendido', description: 'Queda detenido o aplazado por incidencia' },
];

function toDateAndTime(raw?: string | null): { date: string; time: string } {
  if (!raw) return { date: '', time: '' };
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const [date = '', timeWithSeconds = ''] = raw.split('T');
    return { date, time: timeWithSeconds.slice(0, 5) };
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const hours = String(parsed.getUTCHours()).padStart(2, '0');
  const minutes = String(parsed.getUTCMinutes()).padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function EditScheduledMatchModalComponent({ visible, match, saving, onConfirm, onCancel }: EditScheduledMatchModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<EditableScheduledMatchStatus>('programado');

  useEffect(() => {
    if (!visible || !match) return;
    const next = toDateAndTime(getMatchDate(match));
    setDate(next.date);
    setTime(next.time);

    const currentStatus = normalizeMatchStatus(match.estado);
    setStatus(currentStatus === 'cancelado' || currentStatus === 'suspendido' ? currentStatus : 'programado');
  }, [visible, match]);

  const error = useMemo(() => {
    if (!date || !time) return 'La fecha y la hora son obligatorias.';
    if (!isValidDate(date)) return 'La fecha debe tener formato YYYY-MM-DD.';
    if (!isValidTime(time)) return 'La hora debe tener formato HH:MM.';
    return null;
  }, [date, time]);

  const handleConfirm = () => {
    if (error) return;
    onConfirm({
      fecha: `${date}T${time}:00Z`,
      estado: status,
    });
  };

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={saving ? () => undefined : onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
        <Pressable style={{ flex: 1 }} onPress={saving ? undefined : onCancel} />
        <View style={{ backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 40, maxHeight: '90%' }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="create-outline" size={21} color={Colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: '900' }}>Editar partido</Text>
                {match ? <Text numberOfLines={1} style={{ color: Colors.text.secondary, marginTop: 2 }}>{getHomeTeamName(match)} vs {getAwayTeamName(match)}</Text> : null}
              </View>
            </View>

            <Text style={{ color: Colors.text.secondary, marginTop: 22, marginBottom: 8, fontWeight: '800' }}>Fecha</Text>
            <TextInput
              value={date}
              editable={!saving}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.text.disabled}
              autoCapitalize="none"
              style={{ height: 52, borderRadius: 16, backgroundColor: Colors.bg.base, color: Colors.text.primary, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.bg.surface2, fontSize: 16 }}
            />

            <Text style={{ color: Colors.text.secondary, marginTop: 16, marginBottom: 8, fontWeight: '800' }}>Hora</Text>
            <TextInput
              value={time}
              editable={!saving}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor={Colors.text.disabled}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={{ height: 52, borderRadius: 16, backgroundColor: Colors.bg.base, color: Colors.text.primary, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.bg.surface2, fontSize: 16 }}
            />

            <Text style={{ color: Colors.text.secondary, marginTop: 18, marginBottom: 10, fontWeight: '800' }}>Estado permitido</Text>
            <View style={{ gap: 10 }}>
              {STATUS_OPTIONS.map(option => {
                const active = status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    disabled={saving}
                    onPress={() => setStatus(option.value)}
                    activeOpacity={0.9}
                    style={{ borderRadius: theme.borderRadius.lg, backgroundColor: active ? Colors.brand.primary + '20' : Colors.bg.surface2, borderWidth: 1, borderColor: active ? Colors.brand.primary : 'transparent', padding: 14, opacity: saving ? 0.55 : 1 }}
                  >
                    <Text style={{ color: active ? Colors.brand.primary : Colors.text.primary, fontWeight: '900' }}>{option.label}</Text>
                    <Text style={{ color: Colors.text.secondary, marginTop: 3, fontSize: 12 }}>{option.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error ? <Text style={{ color: Colors.semantic.warning, marginTop: 14 }}>{error}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity disabled={saving} onPress={onCancel} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2, opacity: saving ? 0.6 : 1 }}>
                <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={Boolean(error) || saving} onPress={handleConfirm} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: !error && !saving ? Colors.brand.primary : Colors.bg.surface2 }}>
                <Text style={{ color: !error && !saving ? Colors.bg.base : Colors.text.disabled, fontWeight: '900' }}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const EditScheduledMatchModal = memo(EditScheduledMatchModalComponent);
