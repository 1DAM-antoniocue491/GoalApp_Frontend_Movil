/**
 * CreateLeagueModal
 *
 * Bottom-sheet modal para crear una nueva liga.
 * El usuario admin queda asociado automáticamente a la liga creada.
 *
 * Preparado para subida real de logo al backend:
 * — ver sección "LOGO" y la función handlePickImage.
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

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/**
 * Datos que se envían al confirmar la creación de una liga.
 * Exportado para que el caller pueda tipar su handler correctamente.
 */
export interface CreateLeagueForm {
  name: string;
  /** Año de inicio de la temporada. Se muestra como "2025/26" en UI. */
  seasonStartYear: number;
  category: LeagueCategory;
  minTeams: number;
  maxTeams: number;
  minConvocados: number;
  maxConvocados: number;
  minPlantilla: number;
  maxPlantilla: number;
  matchMinutes: number;
  maxMatches: number;

  // --- Logo (preparado para flujo de subida real) ---

  /** URI local del asset seleccionado por el usuario */
  logoUri?: string | null;

  /** URL remota del logo tras la subida al backend */
  logoUrl?: string | null;

  /** Hash del archivo para deduplicación en el backend */
  logoHash?: string | null;

  logoWidth?: number | null;
  logoHeight?: number | null;
}

interface CreateLeagueModalProps {
  visible: boolean;
  onConfirm: (data: CreateLeagueForm) => void;
  onCancel: () => void;
  /**
   * 'create' (por defecto): modal para nueva liga.
   * 'edit': modal para editar una liga existente.
   * Controla título, CTA e inicialización del formulario.
   */
  mode?: 'create' | 'edit';
  /**
   * Valores previos de la liga en modo edición.
   * Se fusionan sobre DEFAULT_FORM al abrirse el modal.
   * Solo se leen en el momento de apertura (visible true).
   */
  initialValues?: Partial<CreateLeagueForm>;
}

// ---------------------------------------------------------------------------
// Constantes de UI
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

/** 2025 → "2025/26" */
function formatSeason(startYear: number): string {
  return `${startYear}/${String(startYear + 1).slice(2)}`;
}

/** 9 temporadas: 2 atrás, año actual, 6 adelante */
const SEASON_OPTIONS: SelectOption[] = Array.from({ length: 9 }, (_, i) => {
  const year = CURRENT_YEAR - 2 + i;
  return { value: String(year), label: formatSeason(year) };
});

/** Categorías con valores estables para backend */
const CATEGORY_OPTIONS: SelectOption[] = (
  Object.entries(CATEGORY_LABELS) as [LeagueCategory, string][]
).map(([value, label]) => ({ value, label }));

/**
 * Valores iniciales del formulario.
 * Dejamos todos los campos de logo a null para diferenciar claramente
 * entre "sin logo todavía" y "logo ya seleccionado/subido".
 */
const DEFAULT_FORM: CreateLeagueForm = {
  name: '',
  seasonStartYear: CURRENT_YEAR,
  category: 'senior',
  minTeams: 6,
  maxTeams: 20,
  minConvocados: 14,
  maxConvocados: 23,
  minPlantilla: 15,
  maxPlantilla: 25,
  matchMinutes: 90,
  maxMatches: 45,
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
          style={{
            width: 44,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
          }}
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
          style={{
            width: 44,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
          }}
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
}: CreateLeagueModalProps) {
  /**
   * Estado del formulario.
   * Aquí vive toda la configuración de la liga antes de confirmar.
   */
  const [form, setForm] = useState<CreateLeagueForm>(DEFAULT_FORM);

  /**
   * Ref para capturar initialValues en el momento exacto de apertura del modal
   * sin necesidad de incluirlo en el array de dependencias del useEffect
   * (evita que cambie la referencia de objeto en cada render).
   */
  const initialValuesRef = useRef<Partial<CreateLeagueForm> | undefined>(initialValues);
  initialValuesRef.current = initialValues;

  /**
   * Estado visual para mostrar spinner mientras:
   * - se espera al picker nativo
   * - se procesa la imagen seleccionada
   */
  const [isPickingImage, setIsPickingImage] = useState(false);

  /**
   * Animaciones del bottom-sheet.
   */
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  /**
   * Animación de entrada / salida del sheet.
   * Cuando se abre, reseteamos el formulario a estado inicial.
   */
  useEffect(() => {
    if (visible) {
      /**
       * En modo edición, fusionamos DEFAULT_FORM con los valores previos de la liga.
       * En modo creación, siempre partimos del formulario vacío.
       */
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
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 120,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  /**
   * Actualiza un campo del formulario.
   * Reutilizamos esta función para no repetir setForm en cada input.
   */
  const update = useCallback(
    <K extends keyof CreateLeagueForm>(key: K, value: CreateLeagueForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Limpia todos los campos de logo a la vez.
   * Esto evita dejar metadatos huérfanos cuando el usuario elimina la imagen.
   */
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
   *
   * Flujo:
   * 1. Pedir permiso de galería.
   * 2. Abrir picker con edición cuadrada activada.
   * 3. Redimensionar a 512×512 y comprimir al 80 % con la API nueva
   *    contextual de expo-image-manipulator.
   * 4. Guardar logoUri, logoWidth, logoHeight en el form.
   * 5. logoHash queda null: se calculará más adelante en backend o service.
   *
   * Importante:
   * - no usamos base64
   * - no subimos todavía la imagen
   * - solo dejamos preparado el estado local y el preview
   */
  const handlePickImage = useCallback(async () => {
    try {
      // ── Permisos ──────────────────────────────────────────────────────
      // En iOS es obligatorio. En Android moderno suele gestionarlo el
      // sistema, pero seguimos pidiéndolo para mantener compatibilidad.
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu galería para subir el logo de la liga.'
        );
        return;
      }

      setIsPickingImage(true);

      // ── Picker ───────────────────────────────────────────────────────
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      // ── Normalización con ImageManipulator ────────────────────────────
      // Redimensionamos a 512x512 y comprimimos en un único paso.
      const processed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Guardamos solo referencia local y metadatos ligeros.
      // Si ya existía una URL remota, la invalidamos porque el logo ha cambiado.
      setForm((prev) => ({
        ...prev,
        logoUri: processed.uri,
        logoWidth: processed.width,
        logoHeight: processed.height,
        logoUrl: null,
        logoHash: null,
      }));
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el logo de la liga.');
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  /**
   * El formulario es válido si al menos tenemos nombre suficiente.
   * Aquí puedes endurecer validaciones más adelante sin cambiar el flujo visual.
   */
  const isValid = form.name.trim().length >= 2;

  /**
   * Confirmación final del modal.
   */
  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    onConfirm(form);
  }, [form, isValid, onConfirm]);

  /**
   * URI a mostrar en el preview.
   * Priorizamos logoUri local para respuesta inmediata.
   * Si no existe, caemos a logoUrl por si el modal se reutiliza con datos remotos.
   */
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
                  {/* Título diferenciado según modo crear o editar */}
                  {mode === 'edit' ? 'Editar liga' : 'Crear nueva liga'}
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
              contentContainerStyle={{
                paddingTop: theme.spacing.xl,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── LOGO ── */}
              {isPickingImage ? (
                // Estado cargando: spinner centrado mientras el picker
                // o el manipulator están procesando
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    marginBottom: 28,
                    // Usamos style porque aquí controlamos medidas exactas del preview
                    // y mantenemos el mismo fondo que la zona de subida.
                    backgroundColor: Colors.bg.base,
                  }}
                >
                  <ActivityIndicator color={Colors.brand.primary} />
                </View>
              ) : previewUri ? (
                // Estado con imagen: preview + acciones
                <View
                  style={{
                    alignSelf: 'center',
                    alignItems: 'center',
                    marginBottom: 28,
                  }}
                >
                  <Image
                    source={{ uri: previewUri }}
                    // style aquí es mejor que className porque Image necesita
                    // medidas exactas y borderRadius preciso.
                    style={{ width: 110, height: 110, borderRadius: 24 }}
                    contentFit="cover"
                    transition={200}
                  />

                  {/* Acciones: cambiar o eliminar */}
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: theme.spacing.lg,
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      onPress={handlePickImage}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={14}
                        color={Colors.brand.accent}
                      />
                      <Text
                        style={{
                          color: Colors.brand.accent,
                          fontSize: theme.fontSize.xs,
                        }}
                      >
                        Cambiar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={clearLogo}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={Colors.semantic.error}
                      />
                      <Text
                        style={{
                          color: Colors.semantic.error,
                          fontSize: theme.fontSize.xs,
                        }}
                      >
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /**
                 * Estado sin imagen: fallback visual con shield-outline,
                 * coherente con LeagueCrest en LeagueCard.
                 * Toda el área es tappable para abrir el picker.
                 * Nunca queda vacío ni parece un estado roto.
                 */
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.75}
                  style={{
                    alignSelf: 'center',
                    alignItems: 'center',
                    marginBottom: 28,
                  }}
                >
                  {/* Shield: mismo patrón que LeagueCrest — sin logo = icono de liga */}
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
                    <Ionicons
                      name="shield-outline"
                      size={44}
                      color={Colors.text.disabled}
                    />
                  </View>

                  {/* Hint de subida: discreto, debajo del shield */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 8,
                    }}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={13}
                      color={Colors.brand.accent}
                    />
                    <Text
                      style={{
                        color: Colors.brand.accent,
                        fontSize: theme.fontSize.xs,
                      }}
                    >
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
                {/*
                  OptionSelectField tiene flex:1 interno, por lo que
                  ambos se reparten el ancho equitativamente en el row.
                */}
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

              {/* ── Equipos ── */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <StepperField
                  label="Mínimo de equipos"
                  value={form.minTeams}
                  onIncrement={() => update('minTeams', form.minTeams + 1)}
                  onDecrement={() => update('minTeams', Math.max(2, form.minTeams - 1))}
                />

                <StepperField
                  label="Máximo de equipos"
                  value={form.maxTeams}
                  onIncrement={() => update('maxTeams', form.maxTeams + 1)}
                  onDecrement={() =>
                    update('maxTeams', Math.max(form.minTeams, form.maxTeams - 1))
                  }
                />
              </View>

              {/* ── Convocados ── */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <StepperField
                  label="Mínimo convocados"
                  value={form.minConvocados}
                  onIncrement={() => update('minConvocados', form.minConvocados + 1)}
                  onDecrement={() =>
                    update('minConvocados', Math.max(1, form.minConvocados - 1))
                  }
                />

                <StepperField
                  label="Máximo convocados"
                  value={form.maxConvocados}
                  onIncrement={() => update('maxConvocados', form.maxConvocados + 1)}
                  onDecrement={() =>
                    update(
                      'maxConvocados',
                      Math.max(form.minConvocados, form.maxConvocados - 1)
                    )
                  }
                />
              </View>

              {/* ── Plantilla ── */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <StepperField
                  label="Mínimo plantilla"
                  value={form.minPlantilla}
                  onIncrement={() => update('minPlantilla', form.minPlantilla + 1)}
                  onDecrement={() =>
                    update('minPlantilla', Math.max(1, form.minPlantilla - 1))
                  }
                />

                <StepperField
                  label="Máximo plantilla"
                  value={form.maxPlantilla}
                  onIncrement={() => update('maxPlantilla', form.maxPlantilla + 1)}
                  onDecrement={() =>
                    update(
                      'maxPlantilla',
                      Math.max(form.minPlantilla, form.maxPlantilla - 1)
                    )
                  }
                />
              </View>

              {/* ── Duración y partidos ── */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                <StepperField
                  label="Minutos por partido"
                  value={form.matchMinutes}
                  onIncrement={() => update('matchMinutes', form.matchMinutes + 5)}
                  onDecrement={() =>
                    update('matchMinutes', Math.max(40, form.matchMinutes - 5))
                  }
                />

                <StepperField
                  label="Máximo de partidos"
                  value={form.maxMatches}
                  onIncrement={() => update('maxMatches', form.maxMatches + 1)}
                  onDecrement={() =>
                    update('maxMatches', Math.max(1, form.maxMatches - 1))
                  }
                />
              </View>
            </ScrollView>

            {/* ── Footer ── */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: 40,
                borderTopWidth: 1,
                borderTopColor: Colors.bg.surface2,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onCancel}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.bg.surface2,
                }}
              >
                <Text
                  style={{
                    color: Colors.text.secondary,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={isValid ? 0.88 : 1}
                onPress={handleConfirm}
                disabled={!isValid}
                style={{
                  flex: 2,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Usamos style porque el fondo depende de si el formulario es válido
                  backgroundColor: isValid
                    ? Colors.brand.primary
                    : `${Colors.brand.primary}40`,
                  flexDirection: 'row',
                  gap: theme.spacing.sm,
                }}
              >
                {/* Icono y label del CTA cambian según modo crear o editar */}
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
                  {mode === 'edit' ? 'Guardar cambios' : 'Crear liga'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const CreateLeagueModal = memo(CreateLeagueModalComponent);