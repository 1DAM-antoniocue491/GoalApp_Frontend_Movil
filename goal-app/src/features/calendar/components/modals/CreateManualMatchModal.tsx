/**
 * CreateManualMatchModal
 *
 * Modal mobile para crear un partido manual.
 * Mantiene la lógica de validación y envío intacta.
 * Visualmente sigue el patrón usado por los modales de calendario:
 * bottom sheet, overlay oscuro, handle, header fijo, formulario con scroll,
 * acción principal elevada y botón cancelar separado.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/src/shared/constants/colors";
import { theme } from "@/src/shared/styles/theme";
import {
  OptionSelectField,
  SelectOption,
} from "@/src/shared/components/ui/OptionSelectField";
import { DateTimePickerField } from "@/src/shared/components/ui/DateTimePickerField";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

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

interface FieldLabelProps {
  label: string;
  helper?: string;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const EMPTY_FORM: CreateManualMatchFormData = {
  homeTeamId: "",
  awayTeamId: "",
  date: "",
  time: "",
  delegateId: "",
  stadium: "",
  round: "",
};

// Medidas concentradas en una constante para ajustar el bottom sheet
// sin buscar valores sueltos por todo el componente.
const MODAL_LAYOUT = {
  overlayOpacityStart: 0,
  overlayOpacityEnd: 1,
  sheetTranslateYStart: 400,
  sheetTranslateYEnd: 0,
  openOverlayDuration: 200,
  openSheetDuration: 300,
  closeOverlayDuration: 160,
  closeSheetDuration: 200,
  maxHeightRatio: 0.9,
  compactBreakpoint: 380,
  minScrollHeight: 150,
  estimatedFixedHeight: 292,
  estimatedErrorHeight: 58,
  handleWidth: 40,
  handleHeight: 4,
  handleRadius: 2,
  sheetTopRadius: 32,
  borderWidth: 1,
  headerCloseSize: 32,
  headerCloseRadius: 16,
  closeIconSize: 16,
  primaryButtonHeight: 56,
  primaryButtonRadius: 18,
  primaryIconSize: 18,
  errorIconSize: 16,
  disabledOpacity: 0.65,
  enabledOpacity: 1,
  shadowOffsetY: -8,
  shadowOpacity: 0.35,
  shadowRadius: 18,
  elevation: 24,
} as const;

// Espaciados del modal. Separarlos del layout evita mezclar
// decisiones visuales con lógica de formulario.
const MODAL_SPACING = {
  sheetPaddingTop: theme.spacing.md,
  sheetPaddingHorizontal: theme.spacing.xl,
  handleMarginBottom: theme.spacing.lg + theme.spacing.xs,
  headerMarginBottom: theme.spacing.xl,
  titleMarginTop: theme.spacing.xs,
  closeHitSlop: theme.spacing.sm,
  contentGap: theme.spacing.xl,
  fieldLabelMarginBottom: theme.spacing.sm,
  fieldHelperMarginTop: theme.spacing.xs,
  fieldStackGap: theme.spacing.md,
  dateTimeGap: theme.spacing.md,
  scrollPaddingBottom: theme.spacing.sm,
  footerPaddingTop: theme.spacing.lg + theme.spacing.xs,
  footerHorizontalPadding: theme.spacing.xl,
  footerGap: theme.spacing.sm + theme.spacing.xs,
  footerRaisedOffset: theme.spacing.xxl + theme.spacing.lg,
  androidNavigationFallback: theme.spacing.xl,
  iosNavigationFallback: theme.spacing.md,
  errorPaddingHorizontal: theme.spacing.md + theme.spacing.xs,
  errorPaddingVertical: theme.spacing.sm + theme.spacing.xs,
  errorGap: theme.spacing.sm + theme.spacing.xs,
  cancelPaddingVertical: theme.spacing.md,
  topClearance: theme.spacing.xl,
} as const;

const MODAL_COLORS = {
  overlay: "rgba(0,0,0,0.65)",
  sheetBackground: Colors.bg.surface1,
  sheetBorder: Colors.bg.surface2,
  handle: Colors.bg.surface2,
  closeBackground: Colors.bg.surface2,
  primaryEnabledBackground: Colors.brand.primary,
  primaryDisabledBackground: Colors.bg.surface2,
  primaryEnabledText: Colors.bg.base,
  primaryDisabledText: Colors.text.disabled,
  footerDivider: Colors.bg.surface2,
  errorBackground: `${Colors.semantic.error}18`,
  errorBorder: Colors.semantic.error,
  shadow: Colors.bg.base,
} as const;

// ---------------------------------------------------------------------------
// Subcomponentes visuales
// ---------------------------------------------------------------------------

function FieldLabel({ label, helper }: FieldLabelProps) {
  return (
    <View style={{ marginBottom: MODAL_SPACING.fieldLabelMarginBottom }}>
      <Text
        className="font-semibold uppercase tracking-wide"
        style={{
          color: Colors.text.secondary,
          fontSize: theme.fontSize.xs,
        }}
      >
        {label}
      </Text>
      {helper ? (
        <Text
          style={{
            color: Colors.text.disabled,
            fontSize: theme.fontSize.xs,
            marginTop: MODAL_SPACING.fieldHelperMarginTop,
          }}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * El picker móvil puede devolver DD/MM/YYYY. Antes de entregar al contenedor,
 * normalizamos a YYYY-MM-DD para evitar errores de FastAPI/Pydantic.
 */
function normalizeDateForSubmit(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;

  const datePart = clean.includes("T") ? clean.split("T")[0] : clean;

  const isoMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const spanishMatch = datePart.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (spanishMatch) {
    const [, day, month, year] = spanishMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }

  return null;
}

/**
 * Normaliza H:m, HH:mm, HH:mm:ss o una fecha ISO a HH:mm.
 *
 * Importante: se devuelve HH:mm, no HH:mm:ss. El contenedor que llama a este
 * modal ya añade los segundos al construir el datetime final para la API.
 * Devolver HH:mm:ss aquí provoca valores inválidos como HH:mm:ss:00.
 */
function normalizeTimeForSubmit(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;

  const timePart = clean.includes("T") ? clean.split("T")[1] : clean;
  const timeMatch = timePart.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?/);

  if (timeMatch) {
    const [, rawHour, rawMinute] = timeMatch;
    const hour = Number(rawHour);
    const minute = Number(rawMinute);

    if (
      Number.isInteger(hour) &&
      hour >= 0 &&
      hour <= 23 &&
      Number.isInteger(minute) &&
      minute >= 0 &&
      minute <= 59
    ) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function CreateManualMatchModal({
  visible,
  onClose,
  onSubmit,
  teamOptions = [],
  defaultRound = "",
  error,
  isSubmitting = false,
}: CreateManualMatchModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<CreateManualMatchFormData>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined,
  );

  const slideAnim = useRef(
    new Animated.Value(MODAL_LAYOUT.sheetTranslateYStart),
  ).current;
  const opacityAnim = useRef(
    new Animated.Value(MODAL_LAYOUT.overlayOpacityStart),
  ).current;

  const isCompact = width < MODAL_LAYOUT.compactBreakpoint;
  const visibleError = validationError ?? error;
  const bottomSafeArea = Math.max(
    insets.bottom,
    Platform.OS === "android"
      ? MODAL_SPACING.androidNavigationFallback
      : MODAL_SPACING.iosNavigationFallback,
  );
  const footerBottomPadding = bottomSafeArea + MODAL_SPACING.footerRaisedOffset;
  const modalMaxHeight = Math.min(
    height - insets.top - MODAL_SPACING.topClearance,
    height * MODAL_LAYOUT.maxHeightRatio,
  );
  const scrollMaxHeight = Math.max(
    modalMaxHeight -
    MODAL_LAYOUT.estimatedFixedHeight -
    footerBottomPadding -
    (visibleError ? MODAL_LAYOUT.estimatedErrorHeight : 0),
    MODAL_LAYOUT.minScrollHeight,
  );
  // Solo bloqueamos por envío en curso: los errores de validación se muestran al pulsar guardar.
  const primaryDisabled = isSubmitting;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: MODAL_LAYOUT.overlayOpacityEnd,
          duration: MODAL_LAYOUT.openOverlayDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: MODAL_LAYOUT.sheetTranslateYEnd,
          duration: MODAL_LAYOUT.openSheetDuration,
          easing: Easing.out(Easing.back(1.0)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: MODAL_LAYOUT.overlayOpacityStart,
          duration: MODAL_LAYOUT.closeOverlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: MODAL_LAYOUT.sheetTranslateYStart,
          duration: MODAL_LAYOUT.closeSheetDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  // Pre-rellena datos internos legacy al abrir, sin mostrarlos en UI.
  useEffect(() => {
    if (visible) {
      setForm((prev) => ({ ...prev, round: defaultRound }));
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
      setValidationError("Selecciona el equipo local");
      return;
    }
    if (!form.awayTeamId) {
      setValidationError("Selecciona el equipo visitante");
      return;
    }
    if (form.homeTeamId === form.awayTeamId) {
      setValidationError("El equipo local y visitante deben ser distintos");
      return;
    }
    if (!form.date) {
      setValidationError("La fecha es obligatoria");
      return;
    }
    if (!form.time) {
      setValidationError("La hora es obligatoria");
      return;
    }

    // Normalizar antes de salir del modal evita que cada pantalla tenga que
    // conocer los formatos que devuelve DateTimePickerField.
    const normalizedDate = normalizeDateForSubmit(form.date);
    const normalizedTime = normalizeTimeForSubmit(form.time);

    if (!normalizedDate || !normalizedTime) {
      setValidationError("Selecciona una fecha y hora válidas");
      return;
    }

    setValidationError(undefined);
    onSubmit({
      ...form,
      // El contenedor recibe fecha ISO y hora HH:mm; no añadimos segundos aquí.
      date: normalizedDate,
      time: normalizedTime,
    });
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View
          className="flex-1 justify-end"
          style={{
            backgroundColor: MODAL_COLORS.overlay,
            opacity: opacityAnim,
          }}
        >
          <Pressable
            className="flex-1"
            onPress={handleClose}
            disabled={isSubmitting}
          />

          <Animated.View
            className="overflow-hidden"
            style={{
              maxHeight: modalMaxHeight,
              transform: [{ translateY: slideAnim }],
              backgroundColor: MODAL_COLORS.sheetBackground,
              borderTopLeftRadius: MODAL_LAYOUT.sheetTopRadius,
              borderTopRightRadius: MODAL_LAYOUT.sheetTopRadius,
              paddingTop: MODAL_SPACING.sheetPaddingTop,
              borderWidth: MODAL_LAYOUT.borderWidth,
              borderColor: MODAL_COLORS.sheetBorder,
              shadowColor: MODAL_COLORS.shadow,
              shadowOffset: { width: 0, height: MODAL_LAYOUT.shadowOffsetY },
              shadowOpacity: MODAL_LAYOUT.shadowOpacity,
              shadowRadius: MODAL_LAYOUT.shadowRadius,
              elevation: MODAL_LAYOUT.elevation,
            }}
          >
            <View
              className="self-center"
              style={{
                width: MODAL_LAYOUT.handleWidth,
                height: MODAL_LAYOUT.handleHeight,
                borderRadius: MODAL_LAYOUT.handleRadius,
                backgroundColor: MODAL_COLORS.handle,
                marginBottom: MODAL_SPACING.handleMarginBottom,
              }}
            />

            <View
              className="flex-row items-center justify-between"
              style={{
                paddingHorizontal: MODAL_SPACING.sheetPaddingHorizontal,
                marginBottom: MODAL_SPACING.headerMarginBottom,
              }}
            >
              <View className="flex-1">
                <Text
                  className="font-bold"
                  style={{
                    color: Colors.text.primary,
                    fontSize: theme.fontSize.xl,
                  }}
                >
                  Nuevo partido
                </Text>
                <Text
                  style={{
                    color: Colors.text.secondary,
                    fontSize: theme.fontSize.xs,
                    marginTop: MODAL_SPACING.titleMarginTop,
                  }}
                >
                  Añade un encuentro manual al calendario de la liga
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                disabled={isSubmitting}
                hitSlop={MODAL_SPACING.closeHitSlop}
                className="items-center justify-center"
                style={{
                  width: MODAL_LAYOUT.headerCloseSize,
                  height: MODAL_LAYOUT.headerCloseSize,
                  borderRadius: MODAL_LAYOUT.headerCloseRadius,
                  backgroundColor: MODAL_COLORS.closeBackground,
                  opacity: isSubmitting
                    ? MODAL_LAYOUT.disabledOpacity
                    : MODAL_LAYOUT.enabledOpacity,
                }}
              >
                <Ionicons
                  name="close"
                  size={MODAL_LAYOUT.closeIconSize}
                  color={Colors.text.secondary}
                />
              </Pressable>
            </View>

            <ScrollView
              className="shrink"
              style={{ maxHeight: scrollMaxHeight }}
              contentContainerStyle={{
                paddingHorizontal: MODAL_SPACING.sheetPaddingHorizontal,
                paddingBottom: MODAL_SPACING.scrollPaddingBottom,
                gap: MODAL_SPACING.contentGap,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
              nestedScrollEnabled
              bounces
            >
              <View>
                <FieldLabel
                  label="Equipos"
                  helper="Selecciona local y visitante. Deben ser equipos diferentes."
                />
                <View style={{ gap: MODAL_SPACING.fieldStackGap }}>
                  <OptionSelectField
                    label="Equipo local"
                    value={form.homeTeamId}
                    options={teamOptions}
                    placeholder="Selecciona el equipo local"
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, homeTeamId: v }))
                    }
                  />
                  <OptionSelectField
                    label="Equipo visitante"
                    value={form.awayTeamId}
                    options={teamOptions}
                    placeholder="Selecciona el equipo visitante"
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, awayTeamId: v }))
                    }
                  />
                </View>
              </View>

              <View>
                <FieldLabel
                  label="Fecha y hora"
                  helper="Define cuándo se jugará el partido."
                />
                <View
                  className={isCompact ? "flex-col" : "flex-row"}
                  style={{ gap: MODAL_SPACING.dateTimeGap }}
                >
                  <DateTimePickerField
                    label="Fecha"
                    value={form.date}
                    mode="date"
                    icon="calendar-outline"
                    onChange={(v) => setForm((prev) => ({ ...prev, date: v }))}
                    style={{ flex: isCompact ? undefined : 1 }}
                  />
                  <DateTimePickerField
                    label="Hora"
                    value={form.time}
                    mode="time"
                    icon="time-outline"
                    onChange={(v) => setForm((prev) => ({ ...prev, time: v }))}
                    style={{ flex: isCompact ? undefined : 1 }}
                  />
                </View>
              </View>
            </ScrollView>

            <View
              style={{
                height: MODAL_LAYOUT.borderWidth,
                backgroundColor: MODAL_COLORS.footerDivider,
              }}
            />

            <View
              style={{
                paddingHorizontal: MODAL_SPACING.footerHorizontalPadding,
                paddingTop: MODAL_SPACING.footerPaddingTop,
                paddingBottom: footerBottomPadding,
                gap: MODAL_SPACING.footerGap,
              }}
            >
              {visibleError ? (
                <View
                  className="flex-row items-center"
                  style={{
                    gap: MODAL_SPACING.errorGap,
                    backgroundColor: MODAL_COLORS.errorBackground,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: MODAL_LAYOUT.borderWidth,
                    borderColor: MODAL_COLORS.errorBorder,
                    paddingHorizontal: MODAL_SPACING.errorPaddingHorizontal,
                    paddingVertical: MODAL_SPACING.errorPaddingVertical,
                  }}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={MODAL_LAYOUT.errorIconSize}
                    color={Colors.semantic.error}
                  />
                  <Text
                    className="flex-1 font-medium"
                    numberOfLines={4}
                    style={{
                      color: Colors.semantic.error,
                      fontSize: theme.fontSize.xs,
                    }}
                  >
                    {visibleError}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.88}
                disabled={primaryDisabled}
                className="flex-row items-center justify-center"
                style={{
                  height: MODAL_LAYOUT.primaryButtonHeight,
                  borderRadius: MODAL_LAYOUT.primaryButtonRadius,
                  gap: MODAL_SPACING.errorGap,
                  backgroundColor: primaryDisabled
                    ? MODAL_COLORS.primaryDisabledBackground
                    : MODAL_COLORS.primaryEnabledBackground,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={MODAL_LAYOUT.primaryIconSize}
                  color={
                    primaryDisabled
                      ? MODAL_COLORS.primaryDisabledText
                      : MODAL_COLORS.primaryEnabledText
                  }
                />
                <Text
                  className="font-bold"
                  style={{
                    color: primaryDisabled
                      ? MODAL_COLORS.primaryDisabledText
                      : MODAL_COLORS.primaryEnabledText,
                    fontSize: theme.fontSize.md,
                  }}
                >
                  {isSubmitting ? "Guardando…" : "Guardar partido"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                disabled={isSubmitting}
                className="items-center"
                style={{
                  paddingVertical: MODAL_SPACING.cancelPaddingVertical,
                  opacity: isSubmitting
                    ? MODAL_LAYOUT.disabledOpacity
                    : MODAL_LAYOUT.enabledOpacity,
                }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color: Colors.text.secondary,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
