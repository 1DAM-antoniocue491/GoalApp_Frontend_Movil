/**
 * CreateManualMatchModal
 *
 * Modal mobile para crear un partido manual.
 * Está alineado con el modal web entregado: equipo local, equipo visitante,
 * fecha y hora. La lógica de API vive fuera del modal; este componente solo
 * valida y entrega los datos al contenedor.
 *
 * Campos antiguos como delegado, estadio y jornada se mantienen como props/data
 * opcionales para no romper llamadas existentes, pero no se muestran porque la
 * API web confirmada crea partidos con POST /partidos/ y payload mínimo.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { Button } from '@/src/shared/components/ui/Button';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateManualMatchFormData = {
  homeTeamId: '',
  awayTeamId: '',
  date: '',
  time: '',
  delegateId: '',
  stadium: '',
  round: '',
};

/**
 * Tokens visuales locales del modal.
 *
 * Usamos Colors y theme siempre que el valor ya existe en el design system.
 * Los valores específicos del modal se centralizan aquí para evitar colores,
 * espaciados o medidas sueltas dentro del JSX o StyleSheet.
 */
const MODAL_DIMENSIONS = {
  maxWidth: 520,
  maxHeight: 720,
  maxHeightRatio: 0.9,
  compactBreakpoint: 380,
  handleWidth: 44,
  handleHeight: 5,
  headerIconSize: 44,
  closeButtonSize: 36,
  headerIcon: 22,
  closeIcon: 22,
  errorIcon: 18,
  shadowOffsetX: 0,
  shadowOffsetY: -8,
  shadowOpacity: 0.35,
  shadowRadius: 22,
  elevation: 24,
  borderWidth: 1,
  closeButtonActiveOpacity: 0.75,
  titleMarginTop: theme.spacing.xs / 2,
  subtitleMarginTop: theme.spacing.xs + 1,
  sectionDescriptionMarginTop: theme.spacing.xs - 1,
  subtitleLineHeight: 20,
  fieldTextLineHeight: 19,
  eyebrowLetterSpacing: 0.6,
  dateFieldFlex: 1.25,
  timeFieldFlex: 1,
} as const;

const MODAL_SPACING = {
  horizontalMargin: theme.spacing.md,
  compactHorizontalPadding: theme.spacing.lg,
  regularHorizontalPadding: theme.spacing.xl,
  compactTopPadding: theme.spacing.md,
  regularTopPadding: theme.spacing.lg,
  closeButtonHitSlop: {
    top: theme.spacing.md,
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
} as const;

const MODAL_COLORS = {
  overlay: 'rgba(2, 6, 23, 0.78)',
  borderSubtle: 'rgba(255, 255, 255, 0.10)',
  dragHandle: 'rgba(148, 163, 184, 0.45)',
  iconSurface: 'rgba(255, 255, 255, 0.08)',
  iconBorder: 'rgba(255, 255, 255, 0.12)',
  closeSurface: 'rgba(255, 255, 255, 0.06)',
  errorText: Colors.semantic.error,
  errorSurface: 'rgba(248, 113, 113, 0.12)',
  errorBorder: 'rgba(248, 113, 113, 0.28)',
  sectionSurface: 'rgba(255, 255, 255, 0.045)',
  shadow: Colors.bg.base,
} as const;

/**
 * Bloque visual reutilizable para agrupar campos dentro del modal.
 */
function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/**
 * El picker móvil puede devolver DD/MM/YYYY. Antes de entregar al contenedor,
 * normalizamos a YYYY-MM-DD para evitar errores de FastAPI/Pydantic.
 */
function normalizeDateForSubmit(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;

  const datePart = clean.includes('T') ? clean.split('T')[0] : clean;

  const isoMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const spanishMatch = datePart.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (spanishMatch) {
    const [, day, month, year] = spanishMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  return null;
}

/**
 * Normaliza H:m, HH:mm o HH:mm:ss a HH:mm:ss.
 */
function normalizeTimeForSubmit(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;

  const timePart = clean.includes('T') ? clean.split('T')[1] : clean;
  const timeMatch = timePart.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);

  if (timeMatch) {
    const [, rawHour, rawMinute, rawSecond = '0'] = timeMatch;
    const hour = Number(rawHour);
    const minute = Number(rawMinute);
    const second = Number(rawSecond);

    if (
      Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
      Number.isInteger(minute) && minute >= 0 && minute <= 59 &&
      Number.isInteger(second) && second >= 0 && second <= 59
    ) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}:${String(parsed.getSeconds()).padStart(2, '0')}`;
  }

  return null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CreateManualMatchModal({
  visible,
  onClose,
  onSubmit,
  teamOptions = [],
  defaultRound = '',
  error,
  isSubmitting = false,
}: CreateManualMatchModalProps) {
  const { width, height } = useWindowDimensions();
  const [form, setForm] = useState<CreateManualMatchFormData>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const isCompact = width < MODAL_DIMENSIONS.compactBreakpoint;
  const modalWidth = Math.min(
    width - MODAL_SPACING.horizontalMargin * 2,
    MODAL_DIMENSIONS.maxWidth,
  );
  const modalMaxHeight = Math.min(
    height * MODAL_DIMENSIONS.maxHeightRatio,
    MODAL_DIMENSIONS.maxHeight,
  );
  const modalHorizontalPadding = isCompact
    ? MODAL_SPACING.compactHorizontalPadding
    : MODAL_SPACING.regularHorizontalPadding;

  // Pre-rellena datos internos legacy al abrir, sin mostrarlos en UI.
  useEffect(() => {
    if (visible) {
      setForm(prev => ({ ...prev, round: defaultRound }));
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
      setValidationError('Selecciona el equipo local');
      return;
    }
    if (!form.awayTeamId) {
      setValidationError('Selecciona el equipo visitante');
      return;
    }
    if (form.homeTeamId === form.awayTeamId) {
      setValidationError('El equipo local y visitante deben ser distintos');
      return;
    }
    if (!form.date) {
      setValidationError('La fecha es obligatoria');
      return;
    }
    if (!form.time) {
      setValidationError('La hora es obligatoria');
      return;
    }

    const normalizedDate = normalizeDateForSubmit(form.date);
    const normalizedTime = normalizeTimeForSubmit(form.time);

    if (!normalizedDate || !normalizedTime) {
      setValidationError('Selecciona una fecha y hora válidas');
      return;
    }

    setValidationError(undefined);
    onSubmit({
      ...form,
      // El contenedor recibirá valores listos para construir YYYY-MM-DDTHH:mm:ss.
      date: normalizedDate,
      time: normalizedTime,
    });
  }

  const visibleError = validationError ?? error;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Overlay — toque fuera cierra el modal. */}
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Pressable interior: evita cerrar al tocar dentro del modal. */}
          <Pressable>
            <View
              style={[
                styles.sheet,
                {
                  width: modalWidth,
                  maxHeight: modalMaxHeight,
                  paddingHorizontal: modalHorizontalPadding,
                  paddingTop: isCompact
                    ? MODAL_SPACING.compactTopPadding
                    : MODAL_SPACING.regularTopPadding,
                },
              ]}
            >
              <View style={styles.handle} />

              {/* Header del modal */}
              <View style={styles.header}>
                <View style={styles.headerIconWrapper}>
                  <Ionicons
                    name="football-outline"
                    size={MODAL_DIMENSIONS.headerIcon}
                    color={Colors.text.primary}
                  />
                </View>

                <View style={styles.headerTextWrapper}>
                  <Text style={styles.eyebrow}>Crear partido manual</Text>
                  <Text style={styles.title}>Nuevo partido</Text>
                  <Text style={styles.subtitle}>
                    Define los equipos y programa la fecha del encuentro.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={MODAL_SPACING.closeButtonHitSlop}
                  disabled={isSubmitting}
                  style={styles.closeButton}
                  activeOpacity={MODAL_DIMENSIONS.closeButtonActiveOpacity}
                >
                  <Ionicons
                    name="close"
                    size={MODAL_DIMENSIONS.closeIcon}
                    color={Colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Error de validación o API */}
              {visibleError && (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={MODAL_DIMENSIONS.errorIcon}
                    color={MODAL_COLORS.errorText}
                  />
                  <Text style={styles.errorText}>{visibleError}</Text>
                </View>
              )}

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                <FormSection
                  title="Equipos"
                  description="Selecciona los dos equipos que participarán en el encuentro."
                >
                  <View style={styles.fieldSpacing}>
                    <OptionSelectField
                      label="Equipo local"
                      value={form.homeTeamId}
                      options={teamOptions}
                      placeholder="Selecciona el equipo local"
                      onChange={v => setForm(prev => ({ ...prev, homeTeamId: v }))}
                    />
                  </View>

                  <View>
                    <OptionSelectField
                      label="Equipo visitante"
                      value={form.awayTeamId}
                      options={teamOptions}
                      placeholder="Selecciona el equipo visitante"
                      onChange={v => setForm(prev => ({ ...prev, awayTeamId: v }))}
                    />
                  </View>
                </FormSection>

                <FormSection
                  title="Programación"
                  description="Configura cuándo se disputará el partido."
                >
                  <View
                    style={[
                      styles.dateTimeRow,
                      { flexDirection: isCompact ? 'column' : 'row' },
                    ]}
                  >
                    <DateTimePickerField
                      label="Fecha"
                      value={form.date}
                      mode="date"
                      icon="calendar-outline"
                      onChange={v => setForm(prev => ({ ...prev, date: v }))}
                      style={{ flex: isCompact ? undefined : MODAL_DIMENSIONS.dateFieldFlex }}
                    />
                    <DateTimePickerField
                      label="Hora"
                      value={form.time}
                      mode="time"
                      icon="time-outline"
                      onChange={v => setForm(prev => ({ ...prev, time: v }))}
                      style={{ flex: isCompact ? undefined : MODAL_DIMENSIONS.timeFieldFlex }}
                    />
                  </View>
                </FormSection>
              </ScrollView>

              {/* Footer de acciones */}
              <View
                style={[
                  styles.footer,
                  { flexDirection: isCompact ? 'column-reverse' : 'row' },
                ]}
              >
                <View style={styles.footerButton}>
                  <Button
                    label="Cancelar"
                    variant="secondary"
                    onPress={handleClose}
                    disabled={isSubmitting}
                  />
                </View>
                <View style={styles.footerButton}>
                  <Button
                    label={isSubmitting ? 'Guardando...' : 'Guardar partido'}
                    variant="primary"
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: MODAL_COLORS.overlay,
    paddingHorizontal: MODAL_SPACING.horizontalMargin,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
    backgroundColor: Colors.bg.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MODAL_COLORS.borderSubtle,
    shadowColor: MODAL_COLORS.shadow,
    shadowOffset: {
      width: MODAL_DIMENSIONS.shadowOffsetX,
      height: MODAL_DIMENSIONS.shadowOffsetY,
    },
    shadowOpacity: MODAL_DIMENSIONS.shadowOpacity,
    shadowRadius: MODAL_DIMENSIONS.shadowRadius,
    elevation: MODAL_DIMENSIONS.elevation,
  },
  handle: {
    alignSelf: 'center',
    width: MODAL_DIMENSIONS.handleWidth,
    height: MODAL_DIMENSIONS.handleHeight,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    backgroundColor: MODAL_COLORS.dragHandle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: theme.spacing.lg,
  },
  headerIconWrapper: {
    width: MODAL_DIMENSIONS.headerIconSize,
    height: MODAL_DIMENSIONS.headerIconSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: MODAL_COLORS.iconSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MODAL_COLORS.iconBorder,
  },
  headerTextWrapper: {
    flex: 1,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
  eyebrow: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    letterSpacing: MODAL_DIMENSIONS.eyebrowLetterSpacing,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    marginTop: MODAL_DIMENSIONS.titleMarginTop,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.sm,
    lineHeight: MODAL_DIMENSIONS.subtitleLineHeight,
    marginTop: MODAL_DIMENSIONS.subtitleMarginTop,
  },
  closeButton: {
    width: MODAL_DIMENSIONS.closeButtonSize,
    height: MODAL_DIMENSIONS.closeButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    backgroundColor: MODAL_COLORS.closeSurface,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: MODAL_COLORS.errorSurface,
    borderWidth: MODAL_DIMENSIONS.borderWidth,
    borderColor: MODAL_COLORS.errorBorder,
  },
  errorText: {
    flex: 1,
    color: MODAL_COLORS.errorText,
    fontSize: theme.fontSize.sm,
    lineHeight: MODAL_DIMENSIONS.fieldTextLineHeight,
    marginLeft: theme.spacing.md,
  },
  scrollContent: {
    paddingBottom: theme.spacing.md,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: MODAL_COLORS.sectionSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MODAL_COLORS.borderSubtle,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  sectionDescription: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.sm,
    lineHeight: MODAL_DIMENSIONS.fieldTextLineHeight,
    marginTop: MODAL_DIMENSIONS.sectionDescriptionMarginTop,
  },
  fieldSpacing: {
    marginBottom: theme.spacing.md,
  },
  dateTimeRow: {
    gap: theme.spacing.md,
  },
  footer: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: MODAL_COLORS.borderSubtle,
  },
  footerButton: {
    flex: 1,
  },
});
