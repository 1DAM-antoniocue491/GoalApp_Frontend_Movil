/**
 * NewMatchModal.tsx
 *
 * Modal para añadir un partido manual a una jornada.
 *
 * Los partidos manuales tienen source: 'manual' y NO se sobrescriben
 * al generar el calendario automático — ver calendarConflicts.ts.
 *
 * Campos:
 * - Equipo local
 * - Equipo visitante
 * - Fecha del partido
 * - Hora del partido
 * - Estadio
 * - Jornada
 *
 * PREPARADO PARA API:
 * onConfirm recibe NewMatchFormData listo para enviar a
 * POST /matches con source: 'manual'.
 */

import React, { useRef, useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { DateTimePickerField } from '@/src/shared/components/ui/DateTimePickerField';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface NewMatchFormData {
  homeTeam: string;
  awayTeam: string;
  /** DD/MM/AAAA */
  date: string;
  /** HH:MM */
  time: string;
  venue: string;
  round: string;
}

interface NewMatchModalProps {
  visible: boolean;
  /** Jornada activa para pre-rellenar el campo round */
  defaultRound?: string;
  onConfirm: (data: NewMatchFormData) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Sub-componente: campo de texto con estilo del modal
// ---------------------------------------------------------------------------

interface ModalInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
}

function ModalInput({
  label,
  value,
  onChange,
  placeholder,
  icon,
  autoCapitalize = 'words',
}: ModalInputProps) {
  return (
    <View>
      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: Colors.bg.surface2,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <Ionicons name={icon} size={17} color={Colors.text.secondary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.disabled}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            color: Colors.text.primary,
            fontSize: theme.fontSize.md,
            // style: height mínimo para tap cómodo en móvil
            paddingVertical: 0,
          }}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function NewMatchModalComponent({
  visible,
  defaultRound = '',
  onConfirm,
  onCancel,
}: NewMatchModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [round, setRound] = useState(defaultRound);

  // Resetear al abrir
  useEffect(() => {
    if (visible) {
      setHomeTeam('');
      setAwayTeam('');
      setDate('');
      setTime('');
      setVenue('');
      setRound(defaultRound);
    }
  }, [visible, defaultRound]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.0)),
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
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  // Validación mínima: equipos obligatorios
  const isValid = homeTeam.trim().length > 0 && awayTeam.trim().length > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm({
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      date,
      time,
      venue: venue.trim(),
      round: round.trim(),
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.65)',
            opacity: opacityAnim,
          }}
        >
          {/* Overlay para cerrar */}
          <Pressable style={{ flex: 1 }} onPress={onCancel} />

          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              backgroundColor: Colors.bg.surface1,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 12,
              paddingBottom: 40,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
              maxHeight: '92%',
            }}
          >
            {/* Handle */}
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

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                marginBottom: 24,
              }}
            >
              <View>
                <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: '700' }}>
                  Nuevo partido
                </Text>
                <Text style={{ color: Colors.text.secondary, fontSize: 13, marginTop: 4 }}>
                  Se añadirá manualmente a la jornada
                </Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Colors.bg.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color={Colors.text.secondary} />
              </Pressable>
            </View>

            {/* Formulario */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 20, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              <ModalInput
                label="Equipo local *"
                value={homeTeam}
                onChange={setHomeTeam}
                placeholder="Nombre del equipo local"
                icon="shield-outline"
              />

              <ModalInput
                label="Equipo visitante *"
                value={awayTeam}
                onChange={setAwayTeam}
                placeholder="Nombre del equipo visitante"
                icon="shield-outline"
              />

              {/* Fecha y hora en fila */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: Colors.text.secondary,
                      fontSize: 12,
                      fontWeight: '600',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Fecha
                  </Text>
                  <DateTimePickerField
                    label=""
                    value={date}
                    mode="date"
                    onChange={setDate}
                    icon="calendar-outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: Colors.text.secondary,
                      fontSize: 12,
                      fontWeight: '600',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Hora
                  </Text>
                  <DateTimePickerField
                    label=""
                    value={time}
                    mode="time"
                    onChange={setTime}
                    icon="time-outline"
                  />
                </View>
              </View>

              <ModalInput
                label="Estadio"
                value={venue}
                onChange={setVenue}
                placeholder="Nombre del estadio"
                icon="location-outline"
              />

              <ModalInput
                label="Jornada"
                value={round}
                onChange={setRound}
                placeholder="Ej: Jornada 10"
                icon="list-outline"
                autoCapitalize="sentences"
              />

              {/* Nota informativa sobre partidos manuales */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  padding: 12,
                  backgroundColor: Colors.bg.surface2,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <Ionicons name="information-circle-outline" size={16} color={Colors.text.disabled} />
                <Text style={{ color: Colors.text.disabled, fontSize: 12, flex: 1, lineHeight: 17 }}>
                  Los partidos manuales no se sobrescriben al generar el calendario automático.
                </Text>
              </View>
            </ScrollView>

            {/* Botones */}
            <View style={{ paddingHorizontal: 24, paddingTop: 20, gap: 10 }}>
              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.88}
                disabled={!isValid}
                style={{
                  height: 56,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isValid ? Colors.brand.primary : Colors.bg.surface2,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons
                  name="add-circle"
                  size={18}
                  color={isValid ? Colors.bg.base : Colors.text.disabled}
                />
                <Text
                  style={{
                    color: isValid ? Colors.bg.base : Colors.text.disabled,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Añadir partido
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onCancel}
                activeOpacity={0.7}
                style={{ paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '500' }}>
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

export const NewMatchModal = memo(NewMatchModalComponent);
