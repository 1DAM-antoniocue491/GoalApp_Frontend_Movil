/**
 * CreateLeagueModal
 *
 * Bottom-sheet modal para crear una liga nueva.
 * Solo recoge los campos de POST /ligas/.
 * La configuración avanzada irá en un paso posterior (LigaConfigModal).
 */

import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { OptionSelectField, type SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { type LeagueCategory, CATEGORY_LABELS } from '@/src/shared/types/league';
import type { LigaCreateRequest } from '@/src/features/leagues/types/league.api.types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/**
 * Estado interno del formulario (UI).
 * Exportado para que el caller pueda tipar initialValues en modo edición.
 * No se envía directamente al backend — se mapea en handleConfirm.
 */
export interface CreateLeagueForm {
  name: string;
  /** Año de inicio de la temporada. Se muestra como "2025/26" en UI. */
  seasonStartYear: number;
  category: LeagueCategory;
  /** Cantidad máxima de partidos → cantidad_partidos */
  maxMatches: number;
  /** Minutos posibles de los partidos → duracion_partido */
  matchMinutes: number;
  /** URI local del asset seleccionado */
  logoUri?: string | null;
  /** URL remota del logo (en edición o tras subida) */
  logoUrl?: string | null;
  logoHash?: string | null;
  logoWidth?: number | null;
  logoHeight?: number | null;
}

interface CreateLeagueModalProps {
  visible: boolean;
  /** Emite el payload listo para POST /ligas/ */
  onConfirm: (data: LigaCreateRequest) => void;
  onCancel: () => void;
  /** 'create' por defecto. 'edit' pre-rellena con initialValues. */
  mode?: 'create' | 'edit';
  initialValues?: Partial<CreateLeagueForm>;
  /** true mientras se envía la petición al backend */
  submitting?: boolean;
  /** Mensaje de error si la petición falló */
  submitError?: string | null;
}

// ---------------------------------------------------------------------------
// Constantes de UI
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

function formatSeason(startYear: number): string {
  return `${startYear}/${String(startYear + 1).slice(2)}`;
}

/** 9 temporadas: 2 atrás, año actual, 6 adelante */
const SEASON_OPTIONS: SelectOption[] = Array.from({ length: 9 }, (_, i) => {
  const year = CURRENT_YEAR - 2 + i;
  return { value: String(year), label: formatSeason(year) };
});

const CATEGORY_OPTIONS: SelectOption[] = (
  Object.entries(CATEGORY_LABELS) as [LeagueCategory, string][]
).map(([value, label]) => ({ value, label }));

const DEFAULT_FORM: CreateLeagueForm = {
  name: '',
  seasonStartYear: CURRENT_YEAR,
  category: 'senior',
  maxMatches: 45,
  matchMinutes: 90,
  logoUri: null,
  logoUrl: null,
  logoHash: null,
  logoWidth: null,
  logoHeight: null,
};

// ---------------------------------------------------------------------------
// Componente interno: stepper numérico
// ---------------------------------------------------------------------------

interface StepperFieldProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function StepperField({ label, value, onIncrement, onDecrement }: StepperFieldProps) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: theme.fontSize.xs,
          marginBottom: theme.spacing.sm,
          lineHeight: 16,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: Colors.bg.surface2,
          backgroundColor: Colors.bg.base,
          height: 52,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          onPress={onDecrement}
          style={{ width: 44, height: 52, alignItems: 'center', justifyContent: 'center' }}
          hitSlop={{ top: 4, bottom: 4 }}
        >
          <Ionicons name="remove" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: Colors.text.primary,
            fontSize: theme.fontSize.md,
            fontWeight: '600',
          }}
        >
          {value}
        </Text>
        <TouchableOpacity
          onPress={onIncrement}
          style={{ width: 44, height: 52, alignItems: 'center', justifyContent: 'center' }}
          hitSlop={{ top: 4, bottom: 4 }}
        >
          <Ionicons name="add" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Modal principal
// ---------------------------------------------------------------------------

function CreateLeagueModalComponent({
  visible,
  onConfirm,
  onCancel,
  mode = 'create',
  initialValues,
  submitting = false,
  submitError = null,
}: CreateLeagueModalProps) {
  const [form, setForm] = useState<CreateLeagueForm>(DEFAULT_FORM);

  /**
   * Ref para capturar initialValues en el momento exacto de apertura
   * sin añadirlos al array de dependencias del useEffect.
   */
  const initialValuesRef = useRef<Partial<CreateLeagueForm> | undefined>(initialValues);
  initialValuesRef.current = initialValues;

  /** Spinner mientras el picker nativo o ImageManipulator están procesando */
  const [isPickingImage, setIsPickingImage] = useState(false);

  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  /** Animación entrada/salida + reset del formulario al abrir */
  useEffect(() => {
    if (visible) {
      setForm(
        mode === 'edit'
          ? { ...DEFAULT_FORM, ...initialValuesRef.current }
          : DEFAULT_FORM
      );
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 120, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  /** Actualiza un campo del formulario sin repetir setForm en cada input */
  const update = useCallback(
    <K extends keyof CreateLeagueForm>(key: K, value: CreateLeagueForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /** Limpia todos los metadatos del logo a la vez para no dejar estado huérfano */
  const clearLogo = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      logoUri: null,
      logoUrl: null,
      logoHash: null,
      logoWidth: null,
      logoHeight: null,
    }));
  }, []);

  /**
   * Abre la galería nativa, recorta en cuadrado y normaliza la imagen.
   * No sube todavía — solo prepara el estado local con el URI procesado.
   */
  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu galería para subir el logo de la liga.'
        );
        return;
      }

      setIsPickingImage(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // Redimensionar a 512×512 y comprimir al 80 %
      const processed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Si ya existía URL remota, la invalidamos porque el logo ha cambiado
      setForm((prev) => ({
        ...prev,
        logoUri: processed.uri,
        logoWidth: processed.width,
        logoHeight: processed.height,
        logoUrl: null,
        logoHash: null,
      }));
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el logo de la liga.');
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  /** Válido si el nombre tiene al menos 2 caracteres */
  const isValid = form.name.trim().length >= 2;

  /**
   * Mapea el estado interno al contrato de POST /ligas/ y emite el payload.
   * No incluye campos de configuración avanzada.
   * No cierra el modal — el caller lo cierra solo si la petición tiene éxito.
   */
  const handleConfirm = useCallback(() => {
    if (!isValid || submitting) return;

    const payload: LigaCreateRequest = {
      nombre: form.name.trim(),
      temporada: `${form.seasonStartYear}/${String(form.seasonStartYear + 1).slice(2)}`,
      categoria: form.category ?? null,
      // Enviados como número, nunca como string
      cantidad_partidos: form.maxMatches,
      duracion_partido: form.matchMinutes,
      logo_url: form.logoUrl ?? null,
    };

    onConfirm(payload);
  }, [form, isValid, onConfirm, submitting]);

  /** URI a mostrar en el preview: local tiene prioridad sobre remota */
  const previewUri = form.logoUri ?? form.logoUrl ?? null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: '#000000b3',
            opacity: opacityAnim,
            justifyContent: 'flex-end',
          }}
        >
          {/* Toca fuera para cerrar */}
          <Pressable style={{ flex: 1 }} onPress={onCancel} />

          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              backgroundColor: Colors.bg.surface1,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              maxHeight: '92%',
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
            }}
          >
            {/* ── Header ── */}
            <View
              style={{
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.md,
                paddingBottom: theme.spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: Colors.bg.surface2,
              }}
            >
              {/* Drag handle */}
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    color: Colors.text.primary,
                    fontSize: theme.fontSize.xxl,
                    fontWeight: '700',
                  }}
                >
                  {mode === 'edit' ? 'Editar liga' : 'Nueva Liga'}
                </Text>
                <TouchableOpacity
                  onPress={onCancel}
                  style={{
                    height: 36,
                    width: 36,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: Colors.bg.surface2,
                  }}
                >
                  <Ionicons name="close" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Cuerpo del formulario ── */}
            <ScrollView
              style={{ paddingHorizontal: theme.spacing.xl }}
              contentContainerStyle={{ paddingTop: theme.spacing.xl, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Logo ── */}
              {isPickingImage ? (
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    marginBottom: 28,
                    backgroundColor: Colors.bg.base,
                  }}
                >
                  <ActivityIndicator color={Colors.brand.primary} />
                </View>
              ) : previewUri ? (
                <View style={{ alignSelf: 'center', alignItems: 'center', marginBottom: 28 }}>
                  <Image
                    source={{ uri: previewUri }}
                    style={{ width: 110, height: 110, borderRadius: 24 }}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={{ flexDirection: 'row', gap: theme.spacing.lg, marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={handlePickImage}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Ionicons name="pencil-outline" size={14} color={Colors.brand.accent} />
                      <Text style={{ color: Colors.brand.accent, fontSize: theme.fontSize.xs }}>
                        Cambiar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={clearLogo}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={Colors.semantic.error} />
                      <Text style={{ color: Colors.semantic.error, fontSize: theme.fontSize.xs }}>
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Sin imagen: shield-outline tappable para abrir picker */
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.75}
                  style={{ alignSelf: 'center', alignItems: 'center', marginBottom: 28 }}
                >
                  <View
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.bg.base,
                      borderWidth: 1,
                      borderColor: Colors.bg.surface2,
                    }}
                  >
                    <Ionicons name="shield-outline" size={44} color={Colors.text.disabled} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Ionicons name="cloud-upload-outline" size={13} color={Colors.brand.accent} />
                    <Text style={{ color: Colors.brand.accent, fontSize: theme.fontSize.xs }}>
                      Subir logo
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* ── Nombre ── */}
              <Text
                style={{
                  color: Colors.text.secondary,
                  fontSize: 13,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Nombre de la liga
              </Text>
              <TextInput
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  // Resalta el borde cuando hay contenido
                  borderColor: form.name ? Colors.brand.primary : Colors.bg.surface2,
                  backgroundColor: Colors.bg.base,
                  paddingHorizontal: theme.spacing.lg,
                  height: 52,
                  color: Colors.text.primary,
                  fontSize: 15,
                  marginBottom: 20,
                }}
                placeholder="La liga"
                placeholderTextColor={Colors.text.disabled}
                value={form.name}
                onChangeText={(t) => update('name', t)}
                autoCapitalize="words"
                returnKeyType="done"
              />

              {/* ── Temporada + Categoría ── */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <OptionSelectField
                  label="Temporada"
                  value={String(form.seasonStartYear)}
                  options={SEASON_OPTIONS}
                  onChange={(v) => update('seasonStartYear', Number(v))}
                />
                <OptionSelectField
                  label="Categoría"
                  value={form.category}
                  options={CATEGORY_OPTIONS}
                  onChange={(v) => update('category', v as LeagueCategory)}
                />
              </View>

              {/* ── Partidos + Minutos ── */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                <StepperField
                  label="Cantidad máxima de partidos"
                  value={form.maxMatches}
                  onIncrement={() => update('maxMatches', form.maxMatches + 1)}
                  onDecrement={() => update('maxMatches', Math.max(1, form.maxMatches - 1))}
                />
                <StepperField
                  label="Minutos posibles de los partidos"
                  value={form.matchMinutes}
                  onIncrement={() => update('matchMinutes', form.matchMinutes + 5)}
                  onDecrement={() => update('matchMinutes', Math.max(40, form.matchMinutes - 5))}
                />
              </View>
            </ScrollView>

            {/* ── Footer ── */}
            <View
              style={{
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: 40,
                borderTopWidth: 1,
                borderTopColor: Colors.bg.surface2,
              }}
            >
              {submitError ? (
                <Text
                  style={{
                    color: Colors.semantic.error,
                    fontSize: theme.fontSize.xs,
                    textAlign: 'center',
                    marginBottom: theme.spacing.md,
                  }}
                >
                  {submitError}
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onCancel}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: Colors.bg.surface2,
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '600' }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={isValid && !submitting ? 0.88 : 1}
                  onPress={handleConfirm}
                  disabled={!isValid || submitting}
                  style={{
                    flex: 2,
                    height: 56,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isValid
                      ? Colors.brand.primary
                      : `${Colors.brand.primary}40`,
                    flexDirection: 'row',
                    gap: theme.spacing.sm,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#0A0A0C" />
                  ) : (
                    <>
                      <Ionicons
                        name={mode === 'edit' ? 'save-outline' : 'add-circle-outline'}
                        size={20}
                        color="#0A0A0C"
                        style={{ opacity: isValid ? 1 : 0.5 }}
                      />
                      <Text
                        style={{
                          color: '#0A0A0C',
                          fontSize: 15,
                          fontWeight: '700',
                          opacity: isValid ? 1 : 0.5,
                        }}
                      >
                        {mode === 'edit' ? 'Guardar cambios' : 'Crear Liga'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const CreateLeagueModal = memo(CreateLeagueModalComponent);
