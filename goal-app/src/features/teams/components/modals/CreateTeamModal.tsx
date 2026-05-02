/**
 * CreateTeamModal
 *
 * Modal slide-up para crear un nuevo equipo dentro de una liga.
 * Campos: nombre, ciudad, color principal (con preview hex), estadio y escudo.
 *
 * Reutiliza:
 * - Button (shared/components/ui) → Cancelar y Crear Equipo
 * - Colors (shared/constants/colors) → todos los valores de color
 * - theme (shared/styles/theme) → spacing, borderRadius, fontSize
 * - styles (shared/styles) → inputRow, input, label, inputIcon, inputPlaceholder
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles } from '@/src/shared/styles';
import { Button } from '@/src/shared/components/ui/Button';
import { useCreateTeam } from '../../hooks/useTeams';

// Tipo local del formulario — solo los campos que el usuario introduce.
// ligaId se inyecta desde el padre, no del formulario.
interface CreateTeamFormData {
  name: string;
  city: string;
  primaryColor: string;
  stadium: string;
}

interface CreateTeamModalProps {
  visible: boolean;
  /** Liga en la que se creará el equipo */
  ligaId: number;
  onClose: () => void;
  /** Llamado tras crear el equipo con éxito */
  onCreated: () => void;
}

const DEFAULT_COLOR = '#C8F558'; // brand.primary del design system
const BADGE_SIZE = 88;
const EMPTY_FORM: CreateTeamFormData = {
  name: '',
  city: '',
  primaryColor: DEFAULT_COLOR,
  stadium: '',
};

export function CreateTeamModal({ visible, ligaId, onClose, onCreated }: CreateTeamModalProps) {
  const [form, setForm] = useState<CreateTeamFormData>(EMPTY_FORM);
  const { mutate, isLoading, isError, error, reset } = useCreateTeam();

  function handleChange(field: keyof CreateTeamFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    const result = await mutate({
      nombre: form.name.trim(),
      id_liga: ligaId,
      colores: /^#[0-9A-Fa-f]{6}$/.test(form.primaryColor) ? form.primaryColor : null,
      escudo: null,
    });
    if (result) {
      setForm(EMPTY_FORM);
      onCreated();
    }
  }

  function handleClose() {
    // Limpiar el form y el error al cerrar
    setForm(EMPTY_FORM);
    reset();
    onClose();
  }

  // Solo mostrar el color real en el swatch si el hex es válido
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(form.primaryColor);
  const swatchColor = isValidHex ? form.primaryColor : Colors.bg.surface2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      {/* Overlay semitransparente — toque fuera cierra el modal */}
      <Pressable
        style={{
          // style: backgroundColor con opacidad no tiene clase Tailwind directa
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.70)',
          justifyContent: 'flex-end',
        }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Pressable interior sin onPress: consume el toque y evita cerrar el modal */}
          <Pressable>
            <View
              style={{
                // style: borderRadius solo en la parte superior — no hay clase Tailwind para esto
                backgroundColor: Colors.bg.surface1,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.xxl,
                // style: sombra elevada para separar visualmente del overlay
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 20,
              }}
            >
              {/* ── Header ── */}
              <View className="flex-row items-center justify-between mb-6">
                <Text
                  style={{
                    color: Colors.text.primary,
                    fontSize: theme.fontSize.xl,
                    fontWeight: '700',
                  }}
                >
                  Nuevo Equipo
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* ── Badge circular del escudo ── */}
              <View className="items-center mb-6">
                {/*
                 * TODO: subida real de escudo pendiente.
                 * El backend acepta `escudo` como URL string en POST /equipos/.
                 * Cuando el storage esté definido (S3, Cloudinary, etc.):
                 *   1. Usar expo-image-picker para seleccionar imagen.
                 *   2. Subir al storage y obtener la URL pública.
                 *   3. Pasar esa URL como `escudo` en el payload.
                 * Por ahora se envía `escudo: null` y la creación funciona igualmente.
                 *
                 * style: tamaño, borderRadius y backgroundColor exactos definidos en constantes.
                 * El color de fondo cambia dinámicamente con el color del equipo.
                 * Nunca queda vacío: siempre muestra el ícono shield como fallback.
                 */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={{
                    width: BADGE_SIZE,
                    height: BADGE_SIZE,
                    borderRadius: BADGE_SIZE / 2,
                    backgroundColor: swatchColor,
                    borderWidth: 3,
                    borderColor: Colors.bg.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="shield"
                    size={BADGE_SIZE * 0.5}
                    // style: color con opacidad — no tiene equivalente directo en NativeWind
                    color="rgba(255,255,255,0.45)"
                  />
                </TouchableOpacity>
                <Text
                  style={{
                    color: Colors.text.secondary,
                    fontSize: theme.fontSize.xs,
                    marginTop: theme.spacing.sm,
                  }}
                >
                  Escudo del equipo
                </Text>
              </View>

              {/* ── Campos del formulario ── */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Campo: Nombre del equipo */}
                <View className="mb-4">
                  <Text className={styles.label} style={{ marginBottom: 6 }}>
                    Nombre del equipo
                  </Text>
                  <View className={styles.inputRow}>
                    <View className={styles.inputIcon}>
                      <Ionicons name="football-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={styles.input}
                      placeholder="Real Madrid CF"
                      placeholderTextColor={styles.inputPlaceholder}
                      value={form.name}
                      onChangeText={v => handleChange('name', v)}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Fila: Ciudad | Color principal */}
                <View className="flex-row gap-3 mb-4">
                  {/* Ciudad */}
                  <View style={{ flex: 1 }}>
                    <Text className={styles.label} style={{ marginBottom: 6 }}>
                      Ciudad
                    </Text>
                    <View className={styles.inputRow}>
                      <TextInput
                        className={styles.input}
                        placeholder="Madrid"
                        placeholderTextColor={styles.inputPlaceholder}
                        value={form.city}
                        onChangeText={v => handleChange('city', v)}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Color principal */}
                  <View style={{ flex: 1 }}>
                    <Text className={styles.label} style={{ marginBottom: 6 }}>
                      Color
                    </Text>
                    <View className={styles.inputRow}>
                      {/*
                       * style: el color del swatch es dinámico (viene del estado del form),
                       * no puede expresarse como clase estática de Tailwind.
                       */}
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: swatchColor,
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: Colors.bg.base,
                        }}
                      />
                      <TextInput
                        className={styles.input}
                        placeholder="#C8F558"
                        placeholderTextColor={styles.inputPlaceholder}
                        value={form.primaryColor}
                        onChangeText={v => handleChange('primaryColor', v)}
                        autoCapitalize="characters"
                        maxLength={7}
                        returnKeyType="next"
                      />
                    </View>
                  </View>
                </View>

                {/* Campo: Estadio */}
                <View className="mb-6">
                  <Text className={styles.label} style={{ marginBottom: 6 }}>
                    Estadio
                  </Text>
                  <View className={styles.inputRow}>
                    <View className={styles.inputIcon}>
                      <Ionicons name="location-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={styles.input}
                      placeholder="Santiago Bernabéu"
                      placeholderTextColor={styles.inputPlaceholder}
                      value={form.stadium}
                      onChangeText={v => handleChange('stadium', v)}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Error de creación */}
              {isError && (
                <Text style={{ color: Colors.semantic.error, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                  {error ?? 'Error al crear el equipo'}
                </Text>
              )}

              {/* ── Footer: Cancelar + Crear Equipo ── */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={handleClose} disabled={isLoading} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={isLoading ? 'Creando...' : 'Crear Equipo'}
                    variant="primary"
                    onPress={handleSubmit}
                    disabled={isLoading || !form.name.trim()}
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
