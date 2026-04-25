/**
 * DateTimePickerField
 *
 * Campo reutilizable para seleccionar fecha o hora usando el picker nativo.
 * En Android muestra el dialog del sistema al pulsar.
 * En iOS muestra un spinner en un modal slide-up con botón "Listo".
 *
 * Trabaja con strings formateados para no contaminar los tipos del formulario:
 * - mode "date" → valor en formato DD/MM/AAAA
 * - mode "time" → valor en formato HH:MM
 *
 * Requiere: @react-native-community/datetimepicker
 * Instalar con: npx expo install @react-native-community/datetimepicker
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  ViewStyle,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles } from '@/src/shared/styles';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DateTimePickerFieldProps {
  label: string;
  /** Valor en formato DD/MM/AAAA (date) o HH:MM (time) */
  value: string;
  mode: 'date' | 'time';
  onChange: (formatted: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  /** Estilo del contenedor externo — útil para ajustar flex en filas */
  style?: ViewStyle;
}

// ─── Helpers de conversión string ↔ Date ─────────────────────────────────────

function parseDateString(str: string): Date | null {
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

function parseTimeString(str: string): Date | null {
  const parts = str.split(':');
  if (parts.length !== 2) return null;
  const [h, m] = parts.map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function DateTimePickerField({ label, value, mode, onChange, icon, style }: DateTimePickerFieldProps) {
  const [show, setShow] = useState(false);

  // Date interna derivada del valor string actual; usamos new Date() como fallback seguro
  const pickerDate = useMemo(() => {
    return (mode === 'date' ? parseDateString(value) : parseTimeString(value)) ?? new Date();
  }, [value, mode]);

  function handleChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    // En Android el dialog se cierra solo; en iOS lo cerramos con "Listo"
    if (Platform.OS === 'android') setShow(false);
    if (!selectedDate) return;
    onChange(mode === 'date' ? formatDate(selectedDate) : formatTime(selectedDate));
  }

  return (
    <View style={[{ flex: 1 }, style]}>
      <Text className={styles.label} style={{ marginBottom: 6 }}>{label}</Text>

      {/*
       * Trigger con el mismo aspecto que styles.inputRow.
       * Muestra el valor formateado o placeholder si está vacío.
       */}
      <TouchableOpacity
        onPress={() => setShow(true)}
        activeOpacity={0.8}
        className={styles.inputRow}
      >
        <View className={styles.inputIcon}>
          <Ionicons name={icon} size={17} color={Colors.text.secondary} />
        </View>
        <Text
          style={{
            // style: color dinámico — primario si hay valor, disabled si está vacío
            flex: 1,
            color: value ? Colors.text.primary : Colors.text.disabled,
            fontSize: theme.fontSize.md,
          }}
          numberOfLines={1}
        >
          {value || (mode === 'date' ? 'Selecciona fecha' : 'Selecciona hora')}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.text.disabled} />
      </TouchableOpacity>

      {/* Android: el picker del sistema se lanza como dialog al renderizarse */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={pickerDate}
          mode={mode}
          display="default"
          onChange={handleChange}
          locale="es"
        />
      )}

      {/* iOS: modal slide-up con spinner nativo + botón "Listo" para confirmar */}
      {Platform.OS === 'ios' && (
        <Modal transparent visible={show} animationType="slide">
          <Pressable
            style={{
              // style: rgba no tiene clase Tailwind directa
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.55)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setShow(false)}
          >
            <Pressable>
              <View
                style={{
                  // style: borderRadius solo en esquinas superiores
                  backgroundColor: Colors.bg.surface1,
                  borderTopLeftRadius: theme.borderRadius.xl,
                  borderTopRightRadius: theme.borderRadius.xl,
                  paddingBottom: theme.spacing.xxl,
                }}
              >
                {/* Barra de confirmación */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    paddingHorizontal: theme.spacing.xl,
                    paddingVertical: theme.spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.bg.surface2,
                  }}
                >
                  <TouchableOpacity onPress={() => setShow(false)}>
                    <Text style={{ color: Colors.brand.primary, fontSize: theme.fontSize.md, fontWeight: '600' }}>
                      Listo
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Spinner del sistema iOS */}
                <DateTimePicker
                  value={pickerDate}
                  mode={mode}
                  display="spinner"
                  onChange={handleChange}
                  locale="es"
                  // style: height exacto requerido por el modo spinner en iOS
                  style={{ height: 200 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
