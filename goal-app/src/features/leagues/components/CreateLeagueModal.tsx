/**
 * CreateLeagueModal
 *
 * Modal móvil para crear una liga.
 *
 * Reglas de producto aplicadas:
 * - No se permite subir logo desde móvil. La liga usa un escudo visual generado.
 * - No se muestra “máximo/cantidad de partidos”; el calendario real se gestiona desde calendario.
 * - Solo se envían a API los campos que el usuario puede editar aquí.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { LigaCreateRequest } from '../types/league.api.types';

interface CreateLeagueModalProps {
  visible: boolean;
  onConfirm: (data: LigaCreateRequest) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitError?: string | null;
}

interface FormState {
  nombre: string;
  temporada: string;
  categoria: string;
  duracionPartido: string;
}

const INITIAL_FORM: FormState = {
  nombre: '',
  temporada: '',
  categoria: '',
  duracionPartido: '',
};

const TEMPORADAS = [
  { value: '2024/25', label: '2024/25' },
  { value: '2025/26', label: '2025/26' },
  { value: '2026/27', label: '2026/27' },
  { value: '2027/28', label: '2027/28' },
];

const CATEGORIAS = [
  { value: '', label: 'Sin categoría' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Juvenil A', label: 'Juvenil A' },
  { value: 'Juvenil B', label: 'Juvenil B' },
  { value: 'Cadete', label: 'Cadete' },
  { value: 'Infantil', label: 'Infantil' },
  { value: 'Veteranos +35', label: 'Veteranos +35' },
  { value: 'Veteranos +40', label: 'Veteranos +40' },
];

const DURACION_PARTIDOS = [
  { value: '', label: 'Usar configuración por defecto' },
  { value: '60', label: '60 minutos' },
  { value: '70', label: '70 minutos' },
  { value: '80', label: '80 minutos' },
  { value: '90', label: '90 minutos' },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={{ color: Colors.semantic.error, fontSize: 12, marginTop: 6 }}>{message}</Text>;
}

function ShieldPreview({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || 'G';
  const palette = useMemo(() => {
    const colors = [Colors.brand.primary, Colors.brand.secondary, Colors.brand.accent, Colors.semantic.warning];
    const index = name.length % colors.length;
    return colors[index];
  }, [name]);

  return (
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: `${palette}22`,
        borderWidth: 1,
        borderColor: `${palette}88`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="shield" size={22} color={palette} />
      <Text style={{ color: palette, fontSize: 20, fontWeight: '800', marginTop: 2 }}>{initial}</Text>
    </View>
  );
}

export function CreateLeagueModal({
  visible,
  onConfirm,
  onCancel,
  submitting = false,
  submitError,
}: CreateLeagueModalProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setForm(INITIAL_FORM);
    setErrors({});
    onCancel();
  }, [onCancel, submitting]);

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length < 3) next.nombre = 'Mínimo 3 caracteres';
    if (!form.temporada) next.temporada = 'Selecciona una temporada';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const payload: LigaCreateRequest = {
      nombre: form.nombre.trim(),
      temporada: form.temporada,
      categoria: form.categoria || undefined,
      activa: true,
      // No enviamos logo_url ni cantidad_partidos: esos campos ya no existen en el flujo móvil.
      duracion_partido: form.duracionPartido ? Number(form.duracionPartido) : undefined,
    };

    await onConfirm(payload);
  }, [form, onConfirm, validate]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bg.base }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={{
            paddingTop: insets.top + theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.bg.surface2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.lg, fontWeight: '800' }}>
              Nueva liga
            </Text>
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 }}>
              Configura la base de tu competición
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleClose}
            disabled={submitting}
            activeOpacity={0.75}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: Colors.bg.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: submitting ? 0.5 : 1,
            }}
          >
            <Ionicons name="close" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {submitError ? (
            <View
              style={{
                backgroundColor: 'rgba(255,69,52,0.1)',
                borderWidth: 1,
                borderColor: Colors.semantic.error,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg,
                flexDirection: 'row',
                gap: theme.spacing.sm,
              }}
            >
              <Ionicons name="alert-circle-outline" size={18} color={Colors.semantic.error} />
              <Text style={{ flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm }}>{submitError}</Text>
            </View>
          ) : null}

          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 13, marginBottom: 8 }}>
              Nombre de la liga
            </Text>
            <TextInput
              value={form.nombre}
              onChangeText={(value) => updateField('nombre', value)}
              editable={!submitting}
              placeholder="Ej: Liga Amateur Sevilla"
              placeholderTextColor={Colors.text.disabled}
              style={{
                height: 52,
                backgroundColor: Colors.bg.surface2,
                borderRadius: theme.borderRadius.lg,
                paddingHorizontal: theme.spacing.lg,
                color: Colors.text.primary,
                fontSize: theme.fontSize.md,
              }}
            />
            <FieldError message={errors.nombre} />
          </View>

          <View pointerEvents={submitting ? 'none' : 'auto'} style={{ opacity: submitting ? 0.55 : 1, marginBottom: theme.spacing.lg }}>
            <OptionSelectField
              label="Temporada"
              value={form.temporada}
              options={TEMPORADAS}
              placeholder="Selecciona temporada"
              onChange={(value) => updateField('temporada', value)}
            />
            <FieldError message={errors.temporada} />
          </View>

          <View pointerEvents={submitting ? 'none' : 'auto'} style={{ opacity: submitting ? 0.55 : 1, marginBottom: theme.spacing.lg }}>
            <OptionSelectField
              label="Categoría"
              value={form.categoria}
              options={CATEGORIAS}
              placeholder="Sin categoría"
              onChange={(value) => updateField('categoria', value)}
            />
          </View>

          <View pointerEvents={submitting ? 'none' : 'auto'} style={{ opacity: submitting ? 0.55 : 1 }}>
            <OptionSelectField
              label="Duración del partido"
              value={form.duracionPartido}
              options={DURACION_PARTIDOS}
              placeholder="Seleccionar duración"
              onChange={(value) => updateField('duracionPartido', value)}
            />
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.md,
            paddingBottom: insets.bottom + theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: Colors.bg.surface2,
            flexDirection: 'row',
            gap: theme.spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={handleClose}
            disabled={submitting}
            activeOpacity={0.85}
            style={{
              flex: 1,
              height: 50,
              borderRadius: theme.borderRadius.lg,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: submitting ? 0.55 : 1,
            }}
          >
            <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
            style={{
              flex: 1,
              height: 50,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: Colors.brand.primary,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: theme.spacing.sm,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? <ActivityIndicator size="small" color={Colors.bg.base} /> : null}
            <Text style={{ color: Colors.bg.base, fontWeight: '800' }}>
              {submitting ? 'Creando...' : 'Crear liga'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
