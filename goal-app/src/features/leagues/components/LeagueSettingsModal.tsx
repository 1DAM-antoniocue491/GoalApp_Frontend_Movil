/**
 * LeagueSettingsModal
 *
 * Modal móvil para editar datos y reglas de una liga.
 *
 * Reglas de producto aplicadas:
 * - No se permite editar/subir logo desde móvil.
 * - No se muestra “máximo de partidos”: el backend puede conservarlo internamente,
 *   pero el usuario no lo configura en este modal.
 * - Solo se cierra tras éxito real de API.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import { activeLeagueStore } from '@/src/state/activeLeague/activeLeagueStore';
import { logger } from '@/src/shared/utils/logger';
import type { LeagueItem } from '@/src/shared/types/league';
import type { LigaUpdateRequest, LeagueConfigResponse, UpdateLeagueConfigRequest } from '../types/league.api.types';
import {
  DEFAULT_LEAGUE_CONFIG,
  deleteLeagueService,
  getLeagueConfigService,
  updateLeagueWithConfigService,
} from '../services/leagueService';

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
  { value: '60', label: '60 min' },
  { value: '70', label: '70 min' },
  { value: '80', label: '80 min' },
  { value: '90', label: '90 min' },
];

interface SettingsForm {
  nombre: string;
  temporada: string;
  categoria: string;
  activa: boolean;
  min_equipos: string;
  max_equipos: string;
  min_convocados: string;
  max_convocados: string;
  min_jugadores_equipo: string;
  minutos_partido: string;
}

const DEFAULT_FORM: SettingsForm = {
  nombre: '',
  temporada: '',
  categoria: '',
  activa: true,
  min_equipos: '2',
  max_equipos: '20',
  min_convocados: '7',
  max_convocados: '18',
  min_jugadores_equipo: '7',
  minutos_partido: '90',
};

interface LeagueSettingsModalProps {
  visible: boolean;
  league: LeagueItem | null;
  onClose: () => void;
  onSuccess: () => void;
  /** Callback opcional usado por Onboarding para limpiar selección tras eliminar. */
  onLeagueDeleted?: () => void;
}

function toNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function validateForm(form: SettingsForm): Record<string, string> {
  const errors: Record<string, string> = {};
  const n = (value: string) => Number(value) || 0;

  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
  else if (form.nombre.trim().length < 3) errors.nombre = 'Mínimo 3 caracteres';

  if (!form.temporada) errors.temporada = 'Selecciona una temporada';
  if (n(form.min_equipos) > n(form.max_equipos)) errors.min_equipos = 'No puede ser mayor que el máximo';
  if (n(form.min_convocados) > n(form.max_convocados)) errors.min_convocados = 'No puede ser mayor que el máximo';

  const minutos = n(form.minutos_partido);
  if (minutos < 30 || minutos > 120) errors.minutos_partido = 'Entre 30 y 120 min';

  return errors;
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: Colors.text.secondary,
        fontSize: theme.fontSize.xs,
        fontWeight: '800',
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
      {required ? <Text style={{ color: Colors.semantic.error }}> *</Text> : null}
    </Text>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={{ color: Colors.semantic.error, fontSize: 12, marginTop: 5 }}>{message}</Text>;
}

function NumberInput({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
      keyboardType="numeric"
      editable={!disabled}
      placeholder={placeholder ?? '0'}
      placeholderTextColor={Colors.text.disabled}
      style={{
        height: 48,
        backgroundColor: Colors.bg.surface2,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.lg,
        color: Colors.text.primary,
        fontSize: theme.fontSize.md,
        opacity: disabled ? 0.55 : 1,
      }}
    />
  );
}

function TextField({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      editable={!disabled}
      placeholder={placeholder}
      placeholderTextColor={Colors.text.disabled}
      style={{
        height: 48,
        backgroundColor: Colors.bg.surface2,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.lg,
        color: Colors.text.primary,
        fontSize: theme.fontSize.md,
        opacity: disabled ? 0.55 : 1,
      }}
    />
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.bg.surface2, marginBottom: theme.spacing.xl }} />;
}


export function LeagueSettingsModal({
  visible,
  league,
  onClose,
  onSuccess,
  onLeagueDeleted,
}: LeagueSettingsModalProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [, setExistingConfig] = useState<LeagueConfigResponse | null>(null);
  const [configExists, setConfigExists] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = useCallback(<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!visible || !league) return;

    setForm({
      ...DEFAULT_FORM,
      nombre: league.name,
      temporada: league.season,
      categoria: league.categoria ?? '',
      activa: league.status === 'active',
    });
    setExistingConfig(null);
    setConfigExists(false);
    setErrors({});
    setSubmitError(null);
    setIsLoadingConfig(true);

    getLeagueConfigService(Number(league.id))
      .then(result => {
        if (!result.success || !result.data) {
          setSubmitError('No se pudo cargar la configuración. Puedes continuar con valores por defecto.');
          return;
        }

        const config = result.data;
        setExistingConfig(config);
        setConfigExists(config.id_configuracion !== 0);
        setForm(prev => ({
          ...prev,
          min_equipos: String(config.min_equipos ?? DEFAULT_LEAGUE_CONFIG.min_equipos),
          max_equipos: String(config.max_equipos ?? DEFAULT_LEAGUE_CONFIG.max_equipos),
          min_convocados: String(config.min_convocados ?? DEFAULT_LEAGUE_CONFIG.min_convocados),
          max_convocados: String(config.max_convocados ?? DEFAULT_LEAGUE_CONFIG.max_convocados),
          min_jugadores_equipo: String(config.min_jugadores_equipo ?? DEFAULT_LEAGUE_CONFIG.min_jugadores_equipo),
          minutos_partido: String(config.minutos_partido ?? DEFAULT_LEAGUE_CONFIG.minutos_partido),
        }));
      })
      .finally(() => setIsLoadingConfig(false));
  }, [visible, league]);

  const handleClose = useCallback(() => {
    if (isSubmitting || isDeleting) return;
    onClose();
  }, [isDeleting, isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!league) return;

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const leaguePayload: LigaUpdateRequest = {
      nombre: form.nombre.trim(),
      temporada: form.temporada,
      categoria: form.categoria || undefined,
      activa: form.activa,
      // No se envía logo_url ni cantidad_partidos: no son campos editables en móvil.
    };

    const configPayload: UpdateLeagueConfigRequest = {
      min_equipos: toNumber(form.min_equipos),
      max_equipos: toNumber(form.max_equipos),
      min_convocados: toNumber(form.min_convocados),
      max_convocados: toNumber(form.max_convocados),
      min_jugadores_equipo: toNumber(form.min_jugadores_equipo),
      minutos_partido: toNumber(form.minutos_partido),
    };

    logger.debug('league/settings', 'Guardando configuración de liga', {
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

    const activeSession = activeLeagueStore.getSession();
    if (activeSession?.leagueId === league.id) {
      activeLeagueStore.setSession({ ...activeSession, leagueName: form.nombre.trim() });
    }

    onSuccess();
    onClose();
  }, [configExists, form, league, onClose, onSuccess]);

  const handleDelete = useCallback(() => {
    if (!league) return;

    Alert.alert(
      'Eliminar liga',
      'Esta acción eliminará la liga. Confirma solo si estás seguro.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            setSubmitError(null);
            const result = await deleteLeagueService(Number(league.id));
            setIsDeleting(false);

            if (!result.success) {
              setSubmitError(result.error ?? 'No se pudo eliminar la liga');
              return;
            }

            onLeagueDeleted?.();
            onClose();
          },
        },
      ],
    );
  }, [league, onClose, onLeagueDeleted]);

  if (!visible || !league) return null;

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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: Colors.bg.surface2,
          }}
        >
          <View>
            <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.lg, fontWeight: '800' }}>
              Configuración de liga
            </Text>
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 }} numberOfLines={1}>
              {league.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleClose}
            disabled={isSubmitting || isDeleting}
            activeOpacity={0.75}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: Colors.bg.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSubmitting || isDeleting ? 0.45 : 1,
            }}
          >
            <Ionicons name="close" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {isLoadingConfig ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm }}>Cargando configuración...</Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxl }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {submitError ? (
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
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.semantic.error} />
                  <Text style={{ flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm, lineHeight: 20 }}>
                    {submitError}
                  </Text>
                </View>
              ) : null}


              <SectionTitle title="Datos generales" />

              <View style={{ marginBottom: theme.spacing.md }}>
                <FieldLabel label="Nombre" required />
                <TextField
                  value={form.nombre}
                  onChange={(value) => updateField('nombre', value)}
                  disabled={isSubmitting || isDeleting}
                  placeholder="Nombre de la liga"
                />
                <FieldError message={errors.nombre} />
              </View>

              <View pointerEvents={isSubmitting || isDeleting ? 'none' : 'auto'} style={{ opacity: isSubmitting || isDeleting ? 0.55 : 1, marginBottom: theme.spacing.md }}>
                <OptionSelectField
                  label="Temporada"
                  value={form.temporada}
                  options={TEMPORADAS}
                  placeholder="Selecciona temporada"
                  onChange={(value) => updateField('temporada', value)}
                />
                <FieldError message={errors.temporada} />
              </View>

              <View pointerEvents={isSubmitting || isDeleting ? 'none' : 'auto'} style={{ opacity: isSubmitting || isDeleting ? 0.55 : 1, marginBottom: theme.spacing.md }}>
                <OptionSelectField
                  label="Categoría"
                  value={form.categoria}
                  options={CATEGORIAS}
                  placeholder="Sin categoría"
                  onChange={(value) => updateField('categoria', value)}
                />
              </View>

              <View style={{ marginBottom: theme.spacing.xl }}>
                <FieldLabel label="Estado" />
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => !isSubmitting && !isDeleting && updateField('activa', true)}
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
                    activeOpacity={0.75}
                  >
                    <Text style={{ color: form.activa ? Colors.brand.primary : Colors.text.secondary, fontWeight: '700' }}>
                      Activa
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => !isSubmitting && !isDeleting && updateField('activa', false)}
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
                    activeOpacity={0.75}
                  >
                    <Text style={{ color: !form.activa ? Colors.semantic.warning : Colors.text.secondary, fontWeight: '700' }}>
                      Finalizada
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Divider />

              <SectionTitle title="Reglas de equipos" />

              <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Mín. equipos" />
                  <NumberInput value={form.min_equipos} onChange={(v) => updateField('min_equipos', v)} disabled={isSubmitting || isDeleting} />
                  <FieldError message={errors.min_equipos} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Máx. equipos" />
                  <NumberInput value={form.max_equipos} onChange={(v) => updateField('max_equipos', v)} disabled={isSubmitting || isDeleting} />
                </View>
              </View>

              <View style={{ marginBottom: theme.spacing.xl }}>
                <FieldLabel label="Mín. jugadores/equipo" />
                <NumberInput value={form.min_jugadores_equipo} onChange={(v) => updateField('min_jugadores_equipo', v)} disabled={isSubmitting || isDeleting} />
                <FieldError message={errors.min_jugadores_equipo} />
              </View>

              <Divider />

              <SectionTitle title="Convocatoria y plantilla" />

              <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Mín. convocados" />
                  <NumberInput value={form.min_convocados} onChange={(v) => updateField('min_convocados', v)} disabled={isSubmitting || isDeleting} />
                  <FieldError message={errors.min_convocados} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Máx. convocados" />
                  <NumberInput value={form.max_convocados} onChange={(v) => updateField('max_convocados', v)} disabled={isSubmitting || isDeleting} />
                </View>
              </View>

              <Divider />

              <SectionTitle title="Partidos y duración" />
              <View pointerEvents={isSubmitting || isDeleting ? 'none' : 'auto'} style={{ opacity: isSubmitting || isDeleting ? 0.55 : 1, marginBottom: theme.spacing.xl }}>
                <OptionSelectField
                  label="Minutos por partido"
                  value={form.minutos_partido}
                  options={MINUTOS_OPTIONS}
                  onChange={(value) => updateField('minutos_partido', value)}
                />
                <FieldError message={errors.minutos_partido} />
              </View>

              <Divider />

              <SectionTitle title="Zona peligrosa" />
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isSubmitting || isDeleting}
                activeOpacity={0.85}
                style={{
                  minHeight: 50,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: Colors.semantic.error,
                  backgroundColor: 'rgba(255,69,52,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: theme.spacing.sm,
                  opacity: isSubmitting || isDeleting ? 0.55 : 1,
                }}
              >
                {isDeleting ? <ActivityIndicator size="small" color={Colors.semantic.error} /> : <Ionicons name="trash-outline" size={18} color={Colors.semantic.error} />}
                <Text style={{ color: Colors.semantic.error, fontWeight: '800' }}>
                  {isDeleting ? 'Eliminando...' : 'Eliminar liga'}
                </Text>
              </TouchableOpacity>
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
                disabled={isSubmitting || isDeleting}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: Colors.bg.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSubmitting || isDeleting ? 0.55 : 1,
                }}
              >
                <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting || isDeleting}
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
                  opacity: isSubmitting || isDeleting ? 0.65 : 1,
                }}
              >
                {isSubmitting ? <ActivityIndicator size="small" color={Colors.bg.base} /> : null}
                <Text style={{ color: Colors.bg.base, fontWeight: '800' }}>
                  {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
