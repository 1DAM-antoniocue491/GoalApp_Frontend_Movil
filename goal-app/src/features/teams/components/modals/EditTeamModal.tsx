/**
 * EditTeamModal.tsx
 *
 * Modal slide-up para editar un equipo existente.
 * Pre-fill con datos actuales del equipo.
 * Llama PUT /equipos/{id} al guardar.
 * Solo navega fuera si la API responde OK.
 */

import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles as sharedStyles } from '@/src/shared/styles';
import { Button } from '@/src/shared/components/ui/Button';
import { useUpdateTeam } from '../../hooks/useTeams';
import { getTeamName, getTeamColor } from '../../types/teams.types';
import type { EquipoResponse } from '../../types/teams.types';

interface EditTeamModalProps {
  visible: boolean;
  team: EquipoResponse;
  onClose: () => void;
  /** Llamado con el equipo actualizado tras éxito */
  onEdited: (updated: EquipoResponse) => void;
}

const BADGE_SIZE = 88;

export function EditTeamModal({ visible, team, onClose, onEdited }: EditTeamModalProps) {
  const { mutate, isLoading, error, reset } = useUpdateTeam();

  const [nombre, setNombre] = useState('');
  const [colores, setColores] = useState('');
  /**
   * ciudad y estadio se muestran en la UI pero:
   * - ciudad: el backend (PUT /equipos/{id}) NO acepta este campo → no se envía al API.
   * - estadio: existe en EquipoDetalleResponse pero no en EquipoUpdate → no se envía al API.
   * Ambos quedan pendientes de soporte backend.
   */
  const [ciudad, setCiudad] = useState('');
  const [estadio, setEstadio] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-fill al abrir el modal
  useEffect(() => {
    if (visible) {
      setNombre(getTeamName(team));
      setColores(getTeamColor(team));
      // ciudad no existe en EquipoResponse → siempre vacío
      setCiudad('');
      // estadio puede venir del detalle si se pasa como campo extra
      setEstadio((team as any).estadio ?? '');
      setFormError(null);
      reset();
    }
  }, [visible, team]);

  // Propagar errores del hook
  useEffect(() => {
    if (error) setFormError(error);
  }, [error]);

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(colores);
  const swatchColor = isValidHex ? colores : Colors.bg.surface2;

  async function handleSave() {
    setFormError(null);
    if (!nombre.trim()) {
      setFormError('El nombre del equipo es obligatorio');
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      colores: isValidHex ? colores : null,
      escudo: team.escudo ?? team.logo_url ?? null,
      id_liga: team.id_liga ?? team.liga_id,
      id_entrenador: team.id_entrenador ?? null,
      id_delegado: team.id_delegado ?? null,
    };

    const result = await mutate(team.id_equipo, payload);
    if (result.success && result.data) {
      onEdited(result.data);
    }
    // Si falla, formError se actualiza por el useEffect de error
  }

  function handleClose() {
    reset();
    setFormError(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.70)', justifyContent: 'flex-end' }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View
              style={{
                backgroundColor: Colors.bg.surface1,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.xxl,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 20,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xl, fontWeight: '700' }}>
                  Editar Equipo
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Badge escudo */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View
                  style={{
                    width: BADGE_SIZE,
                    height: BADGE_SIZE,
                    borderRadius: BADGE_SIZE / 2,
                    backgroundColor: swatchColor + '33',
                    borderWidth: 3,
                    borderColor: isValidHex ? colores : Colors.bg.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 32, fontWeight: '700', color: isValidHex ? colores : Colors.text.secondary }}>
                    {nombre.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Nombre */}
                <View style={{ marginBottom: 16 }}>
                  <Text className={sharedStyles.label} style={{ marginBottom: 6 }}>
                    Nombre del equipo
                  </Text>
                  <View className={sharedStyles.inputRow}>
                    <View className={sharedStyles.inputIcon}>
                      <Ionicons name="shield-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={sharedStyles.input}
                      placeholder="Nombre del equipo"
                      placeholderTextColor={sharedStyles.inputPlaceholder}
                      value={nombre}
                      onChangeText={setNombre}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Color */}
                <View style={{ marginBottom: 16 }}>
                  <Text className={sharedStyles.label} style={{ marginBottom: 6 }}>
                    Color (hex)
                  </Text>
                  <View className={sharedStyles.inputRow}>
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
                      className={sharedStyles.input}
                      placeholder="#C4F135"
                      placeholderTextColor={sharedStyles.inputPlaceholder}
                      value={colores}
                      onChangeText={setColores}
                      autoCapitalize="characters"
                      maxLength={7}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Ciudad — UI only, el backend no acepta este campo aún */}
                <View style={{ marginBottom: 16 }}>
                  <Text className={sharedStyles.label} style={{ marginBottom: 6 }}>
                    Ciudad
                  </Text>
                  <View className={sharedStyles.inputRow}>
                    <View className={sharedStyles.inputIcon}>
                      <Ionicons name="location-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={sharedStyles.input}
                      placeholder="Ciudad del equipo"
                      placeholderTextColor={sharedStyles.inputPlaceholder}
                      value={ciudad}
                      onChangeText={setCiudad}
                      returnKeyType="next"
                    />
                  </View>
                  <Text style={{ color: Colors.text.disabled, fontSize: 10, marginTop: 4, marginLeft: 4 }}>
                    Pendiente de soporte en API
                  </Text>
                </View>

                {/* Estadio — UI only, el backend no acepta este campo aún */}
                <View style={{ marginBottom: 24 }}>
                  <Text className={sharedStyles.label} style={{ marginBottom: 6 }}>
                    Estadio
                  </Text>
                  <View className={sharedStyles.inputRow}>
                    <View className={sharedStyles.inputIcon}>
                      <Ionicons name="business-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={sharedStyles.input}
                      placeholder="Nombre del estadio"
                      placeholderTextColor={sharedStyles.inputPlaceholder}
                      value={estadio}
                      onChangeText={setEstadio}
                      returnKeyType="done"
                    />
                  </View>
                  <Text style={{ color: Colors.text.disabled, fontSize: 10, marginTop: 4, marginLeft: 4 }}>
                    Pendiente de soporte en API
                  </Text>
                </View>
              </ScrollView>

              {/* Error */}
              {formError && (
                <Text style={{ color: Colors.semantic.error, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                  {formError}
                </Text>
              )}

              {/* Acciones */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={handleClose} disabled={isLoading} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={isLoading ? 'Guardando...' : 'Guardar'}
                    variant="primary"
                    onPress={handleSave}
                    disabled={isLoading || !nombre.trim()}
                    isLoading={isLoading}
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
