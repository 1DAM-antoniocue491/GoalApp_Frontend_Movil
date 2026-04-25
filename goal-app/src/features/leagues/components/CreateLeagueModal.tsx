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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface CreateLeagueForm {
  name: string;
  season: string;
  category: string;
  minTeams: number;
  maxTeams: number;
  minConvocados: number;
  maxConvocados: number;
  minPlatilla: number;
  maxPlatilla: number;
  matchMinutes: number;
  maxMatches: number;
}

interface CreateLeagueModalProps {
  visible: boolean;
  onConfirm: (data: CreateLeagueForm) => void;
  onCancel: () => void;
}

const DEFAULT_FORM: CreateLeagueForm = {
  name: '',
  season: '2025/26',
  category: 'Senior',
  minTeams: 6,
  maxTeams: 20,
  minConvocados: 14,
  maxConvocados: 23,
  minPlatilla: 15,
  maxPlatilla: 25,
  matchMinutes: 90,
  maxMatches: 45,
};

interface SelectFieldProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function SelectField({ label, value, onIncrement, onDecrement }: SelectFieldProps) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: Colors.text.secondary, fontSize: 12, marginBottom: 8, lineHeight: 16 }}>
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
        >
          <Ionicons name="remove" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: Colors.text.primary,
            fontSize: 16,
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
        >
          <Ionicons name="add" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CreateLeagueModalComponent({ visible, onConfirm, onCancel }: CreateLeagueModalProps) {
  const [form, setForm] = useState<CreateLeagueForm>(DEFAULT_FORM);
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setForm(DEFAULT_FORM);
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

  const update = useCallback(<K extends keyof CreateLeagueForm>(key: K, value: CreateLeagueForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isValid = form.name.trim().length >= 2;

  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    onConfirm(form);
  }, [form, isValid, onConfirm]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            opacity: opacityAnim,
            justifyContent: 'flex-end',
          }}
        >
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
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingTop: 12,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: Colors.bg.surface2,
              }}
            >
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: '700' }}>
                  Crear nueva liga
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
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ paddingHorizontal: 24 }}
              contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Logo upload zone */}
              <TouchableOpacity
                style={{
                  height: 110,
                  width: 110,
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: Colors.bg.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 28,
                  backgroundColor: Colors.bg.base,
                  gap: 8,
                }}
              >
                <Ionicons name="cloud-upload-outline" size={28} color={Colors.text.disabled} />
                <Text style={{ color: Colors.text.disabled, fontSize: 13 }}>Subir logo</Text>
              </TouchableOpacity>

              {/* Nombre */}
              <Text style={{ color: Colors.text.secondary, fontSize: 13, marginBottom: 8 }}>
                Nombre de la liga
              </Text>
              <TextInput
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: form.name ? Colors.brand.primary : Colors.bg.surface2,
                  backgroundColor: Colors.bg.base,
                  paddingHorizontal: 16,
                  height: 52,
                  color: Colors.text.primary,
                  fontSize: 15,
                  marginBottom: 20,
                }}
                placeholder="La liga"
                placeholderTextColor={Colors.text.disabled}
                value={form.name}
                onChangeText={(t) => update('name', t)}
              />

              {/* Temporada + Categoría */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.secondary, fontSize: 13, marginBottom: 8 }}>
                    Temporada
                  </Text>
                  <TextInput
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: Colors.bg.surface2,
                      backgroundColor: Colors.bg.base,
                      paddingHorizontal: 16,
                      height: 52,
                      color: Colors.text.primary,
                      fontSize: 15,
                    }}
                    placeholder="2025/26"
                    placeholderTextColor={Colors.text.disabled}
                    value={form.season}
                    onChangeText={(t) => update('season', t)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.secondary, fontSize: 13, marginBottom: 8 }}>
                    Categoría
                  </Text>
                  <TextInput
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: Colors.bg.surface2,
                      backgroundColor: Colors.bg.base,
                      paddingHorizontal: 16,
                      height: 52,
                      color: Colors.text.primary,
                      fontSize: 15,
                    }}
                    placeholder="Senior"
                    placeholderTextColor={Colors.text.disabled}
                    value={form.category}
                    onChangeText={(t) => update('category', t)}
                  />
                </View>
              </View>

              {/* Equipos */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <SelectField
                  label="Mínimo de equipos"
                  value={form.minTeams}
                  onIncrement={() => update('minTeams', form.minTeams + 1)}
                  onDecrement={() => update('minTeams', Math.max(2, form.minTeams - 1))}
                />
                <SelectField
                  label="Máximo de equipos"
                  value={form.maxTeams}
                  onIncrement={() => update('maxTeams', form.maxTeams + 1)}
                  onDecrement={() => update('maxTeams', Math.max(form.minTeams, form.maxTeams - 1))}
                />
              </View>

              {/* Convocados */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <SelectField
                  label="Mínimo de convocados"
                  value={form.minConvocados}
                  onIncrement={() => update('minConvocados', form.minConvocados + 1)}
                  onDecrement={() => update('minConvocados', Math.max(1, form.minConvocados - 1))}
                />
                <SelectField
                  label="Máximo de convocados"
                  value={form.maxConvocados}
                  onIncrement={() => update('maxConvocados', form.maxConvocados + 1)}
                  onDecrement={() => update('maxConvocados', Math.max(form.minConvocados, form.maxConvocados - 1))}
                />
              </View>

              {/* Plantilla */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <SelectField
                  label="Mínimo de plantilla"
                  value={form.minPlatilla}
                  onIncrement={() => update('minPlatilla', form.minPlatilla + 1)}
                  onDecrement={() => update('minPlatilla', Math.max(1, form.minPlatilla - 1))}
                />
                <SelectField
                  label="Máximo de plantilla"
                  value={form.maxPlatilla}
                  onIncrement={() => update('maxPlatilla', form.maxPlatilla + 1)}
                  onDecrement={() => update('maxPlatilla', Math.max(form.minPlatilla, form.maxPlatilla - 1))}
                />
              </View>

              {/* Minutos y Partidos */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                <SelectField
                  label="Minutos posibles"
                  value={form.matchMinutes}
                  onIncrement={() => update('matchMinutes', form.matchMinutes + 5)}
                  onDecrement={() => update('matchMinutes', Math.max(40, form.matchMinutes - 5))}
                />
                <SelectField
                  label="Máximo de partidos"
                  value={form.maxMatches}
                  onIncrement={() => update('maxMatches', form.maxMatches + 1)}
                  onDecrement={() => update('maxMatches', Math.max(1, form.maxMatches - 1))}
                />
              </View>
            </ScrollView>

            {/* Footer buttons */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                paddingHorizontal: 24,
                paddingTop: 16,
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
                <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '600' }}>
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
                  backgroundColor: isValid ? Colors.brand.primary : `${Colors.brand.primary}40`,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#0A0A0C" style={{ opacity: isValid ? 1 : 0.5 }} />
                <Text style={{ color: '#0A0A0C', fontSize: 15, fontWeight: '700', opacity: isValid ? 1 : 0.5 }}>
                  Crear liga
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