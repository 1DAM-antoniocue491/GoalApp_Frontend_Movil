/**
 * LeagueSettingsModal
 *
 * Modal de configuración de liga para admins.
 * Campos visibles: idénticos al modal web EditLeagueModal.tsx.
 *
 * Campos NO visibles pero preservados internamente al guardar:
 *   hora_partidos, min_jugadores_equipo, min_partidos_entre_equipos
 *
 * Flujo guardar: updateLeagueWithConfigService (POST/PUT routing inteligente).
 * Flujo eliminar: deleteLeagueService → confirmación → DELETE /ligas/{id}.
 * Solo se cierra tras éxito real.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import {
  getLeagueConfigService,
  updateLeagueWithConfigService,
  deleteLeagueService,
} from '../services/leagueService';
import { activeLeagueStore } from '@/src/state/activeLeague/activeLeagueStore';
import { logger } from '@/src/shared/utils/logger';
import type { LeagueItem } from '@/src/shared/types/league';
import type { LigaUpdateRequest, UpdateLeagueConfigRequest, LeagueConfigResponse } from '../types/league.api.types';

// ─── Opciones de selects (igual que web) ─────────────────────────────────────

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

const MINUTOS_OPTIONS = [
  { value: '60', label: '60 minutos' },
  { value: '70', label: '70 minutos' },
  { value: '80', label: '80 minutos' },
  { value: '90', label: '90 minutos' },
];

// ─── Formulario visible ───────────────────────────────────────────────────────

/**
 * Solo los campos editables visibles.
 * Los campos hora_partidos, min_jugadores_equipo y min_partidos_entre_equipos
 * se preservan de existingConfig pero no aparecen en el formulario.
 */
interface SettingsForm {
  nombre: string;
  temporada: string;
  categoria: string;
  activa: boolean;
  min_equipos: string;
  max_equipos: string;
  min_convocados: string;
  max_convocados: string;
  min_plantilla: string;
  max_plantilla: string;
  minutos_partido: string;
  max_partidos: string;
}

/**
 * Defaults visibles: los que el usuario verá si la API no devuelve configuración.
 * Se usan tanto para el formulario inicial como como fallback campo a campo.
 */
const DEFAULT_VISIBLE_CONFIG = {
  min_equipos: 2,
  max_equipos: 20,
  min_convocados: 14,
  max_convocados: 22,
  min_plantilla: 11,
  max_plantilla: 25,
  minutos_partido: 90,
  max_partidos: 30,
};

const DEFAULT_FORM: SettingsForm = {
  nombre: '',
  temporada: '2025/26',
  categoria: 'Senior',
  activa: true,
  min_equipos: String(DEFAULT_VISIBLE_CONFIG.min_equipos),
  max_equipos: String(DEFAULT_VISIBLE_CONFIG.max_equipos),
  min_convocados: String(DEFAULT_VISIBLE_CONFIG.min_convocados),
  max_convocados: String(DEFAULT_VISIBLE_CONFIG.max_convocados),
  min_plantilla: String(DEFAULT_VISIBLE_CONFIG.min_plantilla),
  max_plantilla: String(DEFAULT_VISIBLE_CONFIG.max_plantilla),
  minutos_partido: String(DEFAULT_VISIBLE_CONFIG.minutos_partido),
  max_partidos: String(DEFAULT_VISIBLE_CONFIG.max_partidos),
};

const TEMPORADA_VALUES = TEMPORADAS.map(t => t.value);
const CATEGORIA_VALUES = CATEGORIAS.map(c => c.value);
const MINUTOS_VALUES = MINUTOS_OPTIONS.map(m => m.value);

/** Normaliza un valor a una de las opciones válidas del select, o devuelve el fallback */
function normalizeOption(value: string | undefined | null, validValues: string[], fallback: string): string {
  if (value && validValues.includes(value)) return value;
  return fallback;
}

// ─── Validación ───────────────────────────────────────────────────────────────

function validateForm(form: SettingsForm): Record<string, string> {
  const errs: Record<string, string> = {};
  const n = (s: string) => Number(s) || 0;

  if (!form.nombre.trim())
    errs.nombre = 'El nombre es obligatorio';
  else if (form.nombre.trim().length < 3)
    errs.nombre = 'Mínimo 3 caracteres';

  if (!form.temporada)
    errs.temporada = 'Selecciona una temporada';

  if (form.min_equipos && form.max_equipos && n(form.min_equipos) > n(form.max_equipos))
    errs.min_equipos = 'No puede ser mayor que el máximo';

  if (form.min_convocados && form.max_convocados && n(form.min_convocados) > n(form.max_convocados))
    errs.min_convocados = 'No puede ser mayor que el máximo';

  if (form.min_plantilla && form.max_plantilla && n(form.min_plantilla) > n(form.max_plantilla))
    errs.min_plantilla = 'No puede ser mayor que el máximo';

  if (!form.minutos_partido)
    errs.minutos_partido = 'Selecciona los minutos de partido';

  if (form.max_partidos && n(form.max_partidos) < 1)
    errs.max_partidos = 'Mínimo 1';

  return errs;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeagueSettingsModalProps {
  visible: boolean;
  league: LeagueItem | null;
  onClose: () => void;
  /** Se llama tras guardar con éxito */
  onSuccess: () => void;
  /** Se llama tras eliminar con éxito (si no se pasa, usa onSuccess) */
  onLeagueDeleted?: () => void;
}

// ─── Sub-componentes locales ──────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: Colors.text.secondary,
        fontSize: theme.fontSize.xs,
        fontWeight: '700',
        letterSpacing: 0.9,
        textTransform: 'uppercase',
        marginBottom: theme.spacing.md,
      }}
    >
      {title}
    </Text>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={{ color: Colors.text.secondary, fontSize: 13, marginBottom: 6, lineHeight: 18 }}>
      {label}
      {required && <Text style={{ color: Colors.semantic.error }}> *</Text>}
    </Text>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <Text style={{ color: Colors.semantic.error, fontSize: 12, marginTop: 4, lineHeight: 16 }}>
      {msg}
    </Text>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.bg.surface2, marginBottom: theme.spacing.xl }} />;
}

function NumberInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
      keyboardType="numeric"
      editable={!disabled}
      placeholderTextColor={Colors.text.disabled}
      style={{
        height: 48,
        backgroundColor: Colors.bg.surface2,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.lg,
        color: Colors.text.primary,
        fontSize: theme.fontSize.md,
        opacity: disabled ? 0.5 : 1,
      }}
    />
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function LeagueSettingsModal({
  visible,
  league,
  onClose,
  onSuccess,
  onLeagueDeleted,
}: LeagueSettingsModalProps) {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Configuración completa cargada desde el backend.
   * Se preserva para rellenar los campos no visibles al guardar
   * (hora_partidos, min_jugadores_equipo, min_partidos_entre_equipos).
   */
  const [existingConfig, setExistingConfig] = useState<LeagueConfigResponse | null>(null);
  /** true si el backend ya tiene config (id_configuracion !== 0) */
  const [configExists, setConfigExists] = useState(false);

  const updateField = useCallback(<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Carga datos de liga + configuración al abrir.
  // Depende de league.id (no del objeto completo) para evitar re-ejecuciones
  // si el padre re-renderiza y crea una nueva referencia con los mismos datos.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible || !league) return;

    // Prefill de datos básicos de la liga.
    // Normaliza temporada y categoría para que coincidan con las opciones del select.
    setForm({
      ...DEFAULT_FORM,
      nombre: league.name || '',
      temporada: normalizeOption(league.season, TEMPORADA_VALUES, '2025/26'),
      categoria: normalizeOption(league.categoria, CATEGORIA_VALUES, ''),
      activa: league.status === 'active',
    });
    setErrors({});
    setSubmitError(null);
    setShowDeleteConfirm(false);
    setExistingConfig(null);
    setIsLoadingConfig(true);

    getLeagueConfigService(Number(league.id))
      .then(result => {
        if (!result.success || !result.data) {
          // Error de red: mantener defaults visibles del formulario, no borrar nada
          if (!result.success) {
            setSubmitError('No se pudo cargar la configuración. Se muestran valores por defecto.');
          }
          setConfigExists(false);
          return;
        }
        const d = result.data;
        setConfigExists(d.id_configuracion !== 0);
        setExistingConfig(d);
        // Aplicar valores de API campo a campo; si un campo viene 0/null usar el default visible
        setForm(prev => ({
          ...prev,
          min_equipos: String(d.min_equipos || DEFAULT_VISIBLE_CONFIG.min_equipos),
          max_equipos: String(d.max_equipos || DEFAULT_VISIBLE_CONFIG.max_equipos),
          min_convocados: String(d.min_convocados || DEFAULT_VISIBLE_CONFIG.min_convocados),
          max_convocados: String(d.max_convocados || DEFAULT_VISIBLE_CONFIG.max_convocados),
          min_plantilla: String(d.min_plantilla || DEFAULT_VISIBLE_CONFIG.min_plantilla),
          max_plantilla: String(d.max_plantilla || DEFAULT_VISIBLE_CONFIG.max_plantilla),
          // Normalizar minutos a una opción válida del select; fallback '90'
          minutos_partido: normalizeOption(
            String(d.minutos_partido || DEFAULT_VISIBLE_CONFIG.minutos_partido),
            MINUTOS_VALUES,
            '90',
          ),
          max_partidos: String(d.max_partidos || DEFAULT_VISIBLE_CONFIG.max_partidos),
        }));
      })
      .finally(() => setIsLoadingConfig(false));
  // league.id es suficiente: si la liga es la misma, no hay que recargar config.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, league?.id]);

  const handleClose = useCallback(() => {
    if (isSubmitting || isDeleting) return;
    onClose();
  }, [isSubmitting, isDeleting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!league) return;

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const n = (s: string): number | undefined => (s !== '' ? Number(s) : undefined);

    // Payload de liga: solo los campos editables visibles
    const leaguePayload: LigaUpdateRequest = {
      nombre: form.nombre.trim(),
      temporada: form.temporada,
      categoria: form.categoria || undefined,
      activa: form.activa,
    };

    // Payload de config: campos visibles + campos ocultos preservados de existingConfig
    const configPayload: UpdateLeagueConfigRequest = {
      hora_partidos: existingConfig?.hora_partidos ?? '17:00',
      min_equipos: n(form.min_equipos),
      max_equipos: n(form.max_equipos),
      min_convocados: n(form.min_convocados),
      max_convocados: n(form.max_convocados),
      min_plantilla: n(form.min_plantilla),
      max_plantilla: n(form.max_plantilla),
      // Preservar valores existentes de campos no visibles
      min_jugadores_equipo: existingConfig?.min_jugadores_equipo ?? n(form.min_plantilla),
      min_partidos_entre_equipos: existingConfig?.min_partidos_entre_equipos ?? 1,
      minutos_partido: n(form.minutos_partido),
      max_partidos: n(form.max_partidos),
    };

    logger.debug('league/settings', 'Guardando configuración', {
      ligaId: league.id,
      leagueKeys: Object.keys(leaguePayload),
      configKeys: Object.keys(configPayload),
    });

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await updateLeagueWithConfigService({
      ligaId: Number(league.id),
      league: leaguePayload,
      config: configPayload,
      configExists,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error ?? 'Error al guardar los cambios');
      return;
    }

    // Actualizar nombre en store si la liga editada es la activa
    const activeSession = activeLeagueStore.getSession();
    if (activeSession?.leagueId === league.id) {
      activeLeagueStore.setSession({ ...activeSession, leagueName: form.nombre.trim() });
    }

    onSuccess();
    onClose();
  }, [form, league, existingConfig, configExists, onClose, onSuccess]);

  const handleDelete = useCallback(async () => {
    if (!league) return;

    setIsDeleting(true);
    setSubmitError(null);

    const result = await deleteLeagueService(Number(league.id));

    setIsDeleting(false);

    if (!result.success) {
      setSubmitError(result.error ?? 'Error al eliminar la liga');
      setShowDeleteConfirm(false);
      return;
    }

    // Si la liga eliminada era la activa, limpiar el store
    if (activeLeagueStore.getLeagueId() === league.id) {
      activeLeagueStore.clearSession();
    }

    onClose();
    if (onLeagueDeleted) {
      onLeagueDeleted();
    } else {
      onSuccess();
    }
  }, [league, onClose, onSuccess, onLeagueDeleted]);

  if (!visible || !league) return null;

  const disableInteraction = isSubmitting || isDeleting;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bg.base }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ── */}
        <View
          style={{
            paddingTop: insets.top + theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: Colors.bg.surface2,
          }}
        >
          <View>
            <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.lg, fontWeight: '700' }}>
              Configuración de Liga
            </Text>
            <Text
              style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 }}
              numberOfLines={1}
            >
              {league.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleClose}
            disabled={disableInteraction}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.bg.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disableInteraction ? 0.4 : 1,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* ── Cargando config ── */}
        {isLoadingConfig ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm }}>
              Cargando configuración...
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxl }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Error banner */}
              {submitError && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: theme.spacing.sm,
                    backgroundColor: 'rgba(255,69,52,0.1)',
                    borderWidth: 1,
                    borderColor: Colors.semantic.error,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.xl,
                  }}
                >
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.semantic.error} style={{ marginTop: 1 }} />
                  <Text style={{ flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm, lineHeight: 20 }}>
                    {submitError}
                  </Text>
                </View>
              )}

              {/* ── Datos de la liga ── */}
              <SectionTitle title="Datos de la liga" />

              {/* Logo — placeholder hasta que exista endpoint real de subida */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <FieldLabel label="Logo de la liga" />
                {/* TODO API: conectar subida real de logo cuando exista endpoint */}
                <TouchableOpacity
                  disabled
                  style={{
                    height: 96,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: Colors.bg.surface2,
                    borderRadius: theme.borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    overflow: 'hidden',
                  }}
                  activeOpacity={0.8}
                >
                  {league.crestUrl ? (
                    <Image
                      source={{ uri: league.crestUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={28} color={Colors.text.disabled} />
                      <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs }}>
                        Sin logo
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={{ color: Colors.text.disabled, fontSize: 11, marginTop: 4 }}>
                  Opcional
                </Text>
              </View>

              {/* Nombre */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <FieldLabel label="Nombre" required />
                <TextInput
                  value={form.nombre}
                  onChangeText={(v) => updateField('nombre', v)}
                  editable={!disableInteraction}
                  placeholder="Ej: Liga Amateur Madrid"
                  placeholderTextColor={Colors.text.disabled}
                  style={{
                    height: 48,
                    backgroundColor: Colors.bg.surface2,
                    borderRadius: theme.borderRadius.lg,
                    paddingHorizontal: theme.spacing.lg,
                    color: Colors.text.primary,
                    fontSize: theme.fontSize.md,
                    opacity: disableInteraction ? 0.5 : 1,
                  }}
                />
                <FieldError msg={errors.nombre} />
              </View>

              {/* Temporada + Categoría */}
              <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <View pointerEvents={disableInteraction ? 'none' : 'auto'} style={{ opacity: disableInteraction ? 0.5 : 1 }}>
                    <OptionSelectField
                      label="Temporada *"
                      value={form.temporada}
                      options={TEMPORADAS}
                      placeholder="Seleccionar"
                      onChange={(v) => updateField('temporada', v)}
                    />
                  </View>
                  <FieldError msg={errors.temporada} />
                </View>

                <View style={{ flex: 1 }}>
                  <View pointerEvents={disableInteraction ? 'none' : 'auto'} style={{ opacity: disableInteraction ? 0.5 : 1 }}>
                    <OptionSelectField
                      label="Categoría"
                      value={form.categoria}
                      options={CATEGORIAS}
                      placeholder="Seleccionar"
                      onChange={(v) => updateField('categoria', v)}
                    />
                  </View>
                </View>
              </View>

              {/* Estado: Activa / Finalizada */}
              <View style={{ marginBottom: theme.spacing.xl }}>
                <FieldLabel label="Estado" />
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => !disableInteraction && updateField('activa', true)}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: theme.borderRadius.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: form.activa ? 'rgba(196,241,53,0.15)' : Colors.bg.surface2,
                      borderWidth: 1,
                      borderColor: form.activa ? Colors.brand.primary : Colors.bg.surface2,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{
                      color: form.activa ? Colors.brand.primary : Colors.text.secondary,
                      fontSize: theme.fontSize.sm,
                      fontWeight: '600',
                    }}>
                      Activa
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => !disableInteraction && updateField('activa', false)}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: theme.borderRadius.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: !form.activa ? 'rgba(255,214,10,0.12)' : Colors.bg.surface2,
                      borderWidth: 1,
                      borderColor: !form.activa ? Colors.semantic.warning : Colors.bg.surface2,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{
                      color: !form.activa ? Colors.semantic.warning : Colors.text.secondary,
                      fontSize: theme.fontSize.sm,
                      fontWeight: '600',
                    }}>
                      Finalizada
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Divider />

              {/* ── Configuración ── */}
              <SectionTitle title="Configuración" />

              {/* Mín. / Máx. equipos */}
              <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Mín. equipos" />
                  <NumberInput
                    value={form.min_equipos}
                    onChange={(v) => updateField('min_equipos', v)}
                    disabled={disableInteraction}
                  />
                  <FieldError msg={errors.min_equipos} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Máx. equipos" />
                  <NumberInput
                    value={form.max_equipos}
                    onChange={(v) => updateField('max_equipos', v)}
                    disabled={disableInteraction}
                  />
                </View>
              </View>

              {/* Mín. / Máx. convocados */}
              <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Mín. convocados" />
                  <NumberInput
                    value={form.min_convocados}
                    onChange={(v) => updateField('min_convocados', v)}
                    disabled={disableInteraction}
                  />
                  <FieldError msg={errors.min_convocados} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Máx. convocados" />
                  <NumberInput
                    value={form.max_convocados}
                    onChange={(v) => updateField('max_convocados', v)}
                    disabled={disableInteraction}
                  />
                </View>
              </View>

              {/* Mín. / Máx. plantilla */}
              <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Mín. plantilla" />
                  <Text style={{ color: Colors.text.disabled, fontSize: 11, marginBottom: 4 }}>
                    Titulares y suplentes
                  </Text>
                  <NumberInput
                    value={form.min_plantilla}
                    onChange={(v) => updateField('min_plantilla', v)}
                    disabled={disableInteraction}
                  />
                  <FieldError msg={errors.min_plantilla} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Máx. plantilla" />
                  <Text style={{ color: Colors.text.disabled, fontSize: 11, marginBottom: 4 }}>
                    Titulares y suplentes
                  </Text>
                  <NumberInput
                    value={form.max_plantilla}
                    onChange={(v) => updateField('max_plantilla', v)}
                    disabled={disableInteraction}
                  />
                </View>
              </View>

              {/* Minutos partido + Máx. partidos */}
              <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
                <View style={{ flex: 1 }}>
                  <View pointerEvents={disableInteraction ? 'none' : 'auto'} style={{ opacity: disableInteraction ? 0.5 : 1 }}>
                    <OptionSelectField
                      label="Minutos partido"
                      value={form.minutos_partido}
                      options={MINUTOS_OPTIONS}
                      onChange={(v) => updateField('minutos_partido', v)}
                    />
                  </View>
                  <FieldError msg={errors.minutos_partido} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Máx. partidos" />
                  <NumberInput
                    value={form.max_partidos}
                    onChange={(v) => updateField('max_partidos', v)}
                    disabled={disableInteraction}
                  />
                  <FieldError msg={errors.max_partidos} />
                </View>
              </View>

              <Divider />

              {/* ── Eliminar liga ── */}
              {showDeleteConfirm ? (
                <View
                  style={{
                    backgroundColor: 'rgba(255,69,52,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,69,52,0.4)',
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                  }}
                >
                  <Text style={{ color: '#FCA5A5', fontSize: theme.fontSize.sm, lineHeight: 20, marginBottom: theme.spacing.lg }}>
                    ¿Estás seguro? Esta acción eliminará la liga y todos sus datos asociados y no se puede deshacer.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                    <TouchableOpacity
                      onPress={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: theme.borderRadius.lg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: Colors.bg.surface2,
                        opacity: isDeleting ? 0.4 : 1,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, fontWeight: '600' }}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDelete}
                      disabled={isDeleting}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: theme.borderRadius.lg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                        backgroundColor: Colors.semantic.error,
                        opacity: isDeleting ? 0.7 : 1,
                      }}
                      activeOpacity={0.85}
                    >
                      {isDeleting ? (
                        <>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={{ color: '#fff', fontSize: theme.fontSize.sm, fontWeight: '700' }}>
                            Eliminando...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={16} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: theme.fontSize.sm, fontWeight: '700' }}>
                            Eliminar Liga
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(true)}
                  disabled={disableInteraction}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 48,
                    borderRadius: theme.borderRadius.lg,
                    opacity: disableInteraction ? 0.4 : 1,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.semantic.error} />
                  <Text style={{ color: Colors.semantic.error, fontSize: theme.fontSize.sm, fontWeight: '600' }}>
                    Eliminar Liga
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* ── Botones fijos ── */}
            <View
              style={{
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.md,
                paddingBottom: Math.max(insets.bottom + theme.spacing.md, theme.spacing.xl),
                borderTopWidth: 1,
                borderTopColor: Colors.bg.surface2,
                backgroundColor: Colors.bg.base,
                flexDirection: 'row',
                gap: theme.spacing.md,
              }}
            >
              <TouchableOpacity
                onPress={handleClose}
                disabled={disableInteraction}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: theme.borderRadius.xl,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: Colors.bg.surface2,
                  opacity: disableInteraction ? 0.4 : 1,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '600' }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={disableInteraction}
                style={{
                  flex: 2,
                  height: 52,
                  borderRadius: theme.borderRadius.xl,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: theme.spacing.sm,
                  backgroundColor: Colors.brand.primary,
                  opacity: disableInteraction ? 0.7 : 1,
                }}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.bg.base} />
                    <Text style={{ color: Colors.bg.base, fontSize: theme.fontSize.md, fontWeight: '700' }}>
                      Guardando...
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: Colors.bg.base, fontSize: theme.fontSize.md, fontWeight: '700' }}>
                    Guardar Cambios

                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
