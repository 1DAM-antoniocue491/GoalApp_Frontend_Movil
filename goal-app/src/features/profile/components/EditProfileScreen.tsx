/**
 * EditProfileScreen
 *
 * Edita únicamente los campos permitidos por el flujo móvil:
 * nombre completo, teléfono y fecha de nacimiento.
 *
 * La fecha se selecciona con el componente compartido DateTimePickerField,
 * se muestra como DD/MM/YYYY y se envía a la API como YYYY-MM-DD.
 * El teléfono ofrece feedback inmediato de validez antes de guardar.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardTypeOptions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/src/shared/styles';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';
import { useProfile } from '@/src/features/profile/hooks/useProfile';

// ─── Helpers de presentación y formato ──────────────────────────────────────

/** Genera iniciales a partir del nombre. */
function getInitials(name: string): string {
  if (!name.trim()) return '';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** Añade cero delante para fechas. */
function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Valida una fecha real en formato YYYY-MM-DD sin desplazamientos por zona horaria. */
function parseApiDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Valida una fecha real en formato DD/MM/YYYY. */
function parseDisplayDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Convierte YYYY-MM-DD a DD/MM/YYYY para el DateTimePickerField compartido. */
function apiDateToDisplay(value: string): string {
  if (!value.trim()) return '';

  const date = parseApiDate(value);
  if (!date) return '';

  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Convierte DD/MM/YYYY a YYYY-MM-DD, que es el formato correcto para la API. */
function displayDateToApi(value: string): string {
  if (!value.trim()) return '';

  const date = parseDisplayDate(value);
  if (!date) return '';

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Acepta fechas que puedan venir desde API o desde estados antiguos y las normaliza a YYYY-MM-DD. */
function normalizeProfileDate(value?: string | null): string {
  const raw = value?.trim() ?? '';
  if (!raw) return '';

  if (parseApiDate(raw)) return raw;

  const parsedDisplayDate = parseDisplayDate(raw);
  if (parsedDisplayDate) {
    return `${parsedDisplayDate.getFullYear()}-${pad2(parsedDisplayDate.getMonth() + 1)}-${pad2(
      parsedDisplayDate.getDate()
    )}`;
  }

  return '';
}

// ─── Helpers de teléfono ────────────────────────────────────────────────────

/** Normaliza el teléfono para validar manteniendo compatibilidad con + internacional. */
function normalizePhone(value: string): string {
  return value.replace(/[\s().-]/g, '');
}

/**
 * Valida teléfono de forma práctica para móvil:
 * - opcional;
 * - permite + inicial;
 * - exige exactamente 9 dígitos.
 */
function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  const normalized = normalizePhone(trimmed);
  return /^\+?\d{9}$/.test(normalized);
}

function getPhoneFeedback(value: string): { type: 'idle' | 'valid' | 'invalid'; message: string } {
  if (!value.trim()) {
    return {
      type: 'idle',
      message: 'Opcional. Puedes introducir 9 dígitos.',
    };
  }

  if (isValidPhone(value)) {
    return {
      type: 'valid',
      message: 'Número de teléfono válido.',
    };
  }

  return {
    type: 'invalid',
    message: 'Revisa el teléfono. Debe tener exactamente 9 dígitos.',
  };
}

// ─── Pantalla ────────────────────────────────────────────────────────────────

export function EditProfileScreen() {
  const router = useRouter();
  const { profile, isLoading, isSaving, error, updateProfile } = useProfile();

  // Formulario con prefill desde API.
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(''); // API format: YYYY-MM-DD
  const [formError, setFormError] = useState<string | null>(null);

  const phoneFeedback = useMemo(() => getPhoneFeedback(telefono), [telefono]);

  // Rellenar formulario cuando el perfil cargue desde API.
  useEffect(() => {
    if (!profile) return;

    setNombre(profile.nombre ?? '');
    setTelefono(profile.telefono ?? '');
    setFechaNacimiento(normalizeProfileDate(profile.fechaNacimiento));
  }, [profile]);

  // Propagar errores controlados del hook al formulario.
  useEffect(() => {
    if (error) setFormError(error);
  }, [error]);

  const handleSave = async () => {
    setFormError(null);

    const cleanName = nombre.trim();
    const cleanPhone = telefono.trim();
    const cleanBirthDate = fechaNacimiento.trim();

    if (cleanName.length > 0 && cleanName.length < 2) {
      setFormError('El nombre completo debe tener al menos 2 caracteres.');
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      setFormError('El teléfono no tiene un formato válido.');
      return;
    }

    if (cleanBirthDate && !parseApiDate(cleanBirthDate)) {
      setFormError('Selecciona una fecha de nacimiento válida.');
      return;
    }

    const success = await updateProfile({
      nombre: cleanName || null,
      telefono: cleanPhone || null,
      fecha_nacimiento: cleanBirthDate || null,
    });

    if (success) {
      router.back();
    }
  };

  const initials = nombre ? getInitials(nombre) : '';
  const displayBirthDate = apiDateToDisplay(fechaNacimiento);

  const phoneFeedbackColor =
    phoneFeedback.type === 'valid'
      ? Colors.semantic.success
      : phoneFeedback.type === 'invalid'
        ? Colors.semantic.error
        : Colors.text.secondary;

  return (
    <View className={styles.screenBase}>
      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header de edición. */}
          <View className="flex-row justify-between items-center px-5 mt-2 mb-3">
            <Text className="text-white text-2xl font-extrabold">Editar Perfil</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="rounded-2xl p-4 border"
              style={{ backgroundColor: Colors.bg.surface1, borderColor: Colors.bg.surface2 }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-outline" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Loading inicial. */}
          {isLoading && (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={Colors.brand.primary} />
              <Text className="mt-3 text-sm" style={{ color: Colors.text.secondary }}>
                Cargando perfil...
              </Text>
            </View>
          )}

          {!isLoading && (
            <>
              {/* Avatar visual: no se edita desde este formulario. */}
              <View className="items-center px-5 mb-6">
                <View
                  className="rounded-full border mb-3 items-center justify-center w-24 h-24"
                  style={{ backgroundColor: Colors.bg.surface1, borderColor: Colors.bg.surface2 }}
                >
                  {initials ? (
                    <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.brand.primary }}>
                      {initials}
                    </Text>
                  ) : (
                    <Ionicons name="person" size={50} color={Colors.brand.primary} />
                  )}
                </View>
                <Text className="text-white text-xl font-bold">{nombre || 'Sin nombre'}</Text>
              </View>

              {/* Error de formulario/API. */}
              {formError ? (
                <View
                  className="mx-5 mb-4 rounded-2xl p-4"
                  style={{
                    backgroundColor: `${Colors.semantic.error}18`,
                    borderWidth: 1,
                    borderColor: `${Colors.semantic.error}55`,
                  }}
                >
                  <Text className="text-sm text-center" style={{ color: Colors.semantic.error }}>
                    {formError}
                  </Text>
                </View>
              ) : null}

              {/* Formulario: solo campos permitidos por perfil móvil. */}
              <View
                className="mx-5 rounded-3xl p-5 border mb-6"
                style={{ backgroundColor: Colors.bg.surface1, borderColor: Colors.bg.surface2 }}
              >
                <Text className="mb-4 font-semibold" style={{ color: Colors.brand.primary }}>
                  Información personal
                </Text>

                <FieldRow
                  icon="person-outline"
                  label="Nombre completo"
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre completo"
                />

                <FieldRow
                  icon="call-outline"
                  label="Teléfono"
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="Ej: 612345678"
                  keyboardType="phone-pad"
                  feedback={phoneFeedback.message}
                  feedbackColor={phoneFeedbackColor}
                />

                {/* Fecha compartida: DateTimePickerField trabaja en DD/MM/YYYY. */}
                <View className="flex-row items-center">
                  <View className="p-3 rounded-xl mr-3" style={{ backgroundColor: Colors.bg.base }}>
                    <Ionicons name="calendar-clear-outline" size={18} color={Colors.text.secondary} />
                  </View>
                  <View className="flex-1">
                    <DateTimePickerField
                      label="Fecha de nacimiento"
                      value={displayBirthDate}
                      mode="date"
                      icon="calendar-clear-outline"
                      onChange={(formattedDate) => {
                        setFechaNacimiento(displayDateToApi(formattedDate));
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Acciones principales. */}
              <View className="flex-row w-full px-5 gap-3 mb-6">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="flex-1 rounded-3xl p-4 border items-center"
                  style={{ backgroundColor: Colors.bg.surface1, borderColor: Colors.bg.surface2 }}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-black">Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isSaving || phoneFeedback.type === 'invalid'}
                  className="flex-1 rounded-3xl p-4 items-center"
                  style={{
                    backgroundColor: Colors.brand.primary,
                    opacity: isSaving || phoneFeedback.type === 'invalid' ? 0.6 : 1,
                  }}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={Colors.bg.base} />
                  ) : (
                    <View className="flex-row items-center justify-center gap-2">
                      <Ionicons name="save-outline" size={20} color={Colors.bg.base} />
                      <Text className="font-black" style={{ color: Colors.bg.base }}>
                        Guardar
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Componente interno de campo de formulario ──────────────────────────────

interface FieldRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  feedback?: string;
  feedbackColor?: string;
  isLast?: boolean;
}

function FieldRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder = '',
  editable = true,
  keyboardType = 'default',
  feedback,
  feedbackColor = Colors.text.secondary,
  isLast = false,
}: FieldRowProps) {
  return (
    <View className={`flex-row items-start ${isLast ? '' : 'mb-4'}`}>
      <View className="p-3 rounded-xl mr-3 mt-6" style={{ backgroundColor: Colors.bg.base }}>
        <Ionicons name={icon} size={18} color={Colors.text.secondary} />
      </View>
      <View className="flex-1">
        <Text className={styles.label} style={{ marginBottom: 6 }}>
          {label}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.disabled}
          editable={editable}
          keyboardType={keyboardType}
          className={styles.inputRow}
          style={{
            color: editable ? Colors.text.primary : Colors.text.disabled,
            fontSize: theme.fontSize.md,
          }}
        />
        {feedback ? (
          <Text style={{ color: feedbackColor, marginTop: 8, fontSize: theme.fontSize.sm }}>
            {feedback}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
