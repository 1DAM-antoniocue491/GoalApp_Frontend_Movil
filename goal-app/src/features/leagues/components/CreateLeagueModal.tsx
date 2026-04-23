import React, { memo, useEffect, useMemo, useState, useCallback } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Constantes visuales del proyecto
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

// Select reutilizable
import {
  OptionSelectField,
  SelectOption,
} from '@/src/shared/components/ui/OptionSelectField';

/**
 * Tipo del formulario de creación de liga.
 * Mantenemos la forma general que ya estabas usando.
 */
export interface CreateLeagueForm {
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

/**
 * Categorías permitidas.
 * Aquí sí usamos select, como pediste.
 */
const CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Senior', value: 'Senior' },
  { label: 'Juvenil', value: 'Juvenil' },
  { label: 'Infantil', value: 'Infantil' },
  { label: 'Femenina', value: 'Femenina' },
  { label: 'Mixta', value: 'Mixta' },
];

/**
 * Crea una temporada de ejemplo tipo 2025/26.
 */
function getDefaultSeason() {
  const year = new Date().getFullYear();
  const nextShort = String((year + 1) % 100).padStart(2, '0');
  return `${year}/${nextShort}`;
}

/**
 * Formato visual del texto de temporada.
 * Permite que el usuario escriba números y se conviertan a 2025/26.
 *
 * Ejemplos:
 * 2025 -> 2025
 * 202526 -> 2025/26
 */
function formatSeasonInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 6);

  if (digits.length <= 4) {
    return digits;
  }

  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}`;
}

/**
 * Valores iniciales del formulario.
 */
const DEFAULT_FORM: CreateLeagueForm = {
  name: '',
  season: getDefaultSeason(),
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

interface StepperFieldProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

/**
 * Campo numérico con botones - y +
 * Reutilizable dentro del modal para todas las cantidades.
 */
function StepperField({
  label,
  value,
  onIncrement,
  onDecrement,
}: StepperFieldProps) {
  return (
    <View style={{ flex: 1 }}>
      {/* Etiqueta */}
      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: 13,
          marginBottom: 8,
          lineHeight: 18,
        }}
      >
        {label}
      </Text>

      {/* Contenedor del stepper */}
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: Colors.bg.surface2,
          backgroundColor: Colors.bg.base,
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Botón decrementar */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDecrement}
          style={{
            width: 48,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRightWidth: 1,
            borderRightColor: Colors.bg.surface2,
          }}
        >
          <Ionicons name="remove" size={18} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Valor actual */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: Colors.text.primary,
              fontSize: 15,
              lineHeight: 20,
              fontWeight: '600',
            }}
          >
            {value}
          </Text>
        </View>

        {/* Botón incrementar */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onIncrement}
          style={{
            width: 48,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeftWidth: 1,
            borderLeftColor: Colors.bg.surface2,
          }}
        >
          <Ionicons name="add" size={18} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CreateLeagueModalComponent({
  visible,
  onConfirm,
  onCancel,
}: CreateLeagueModalProps) {
  /**
   * Estado principal del formulario.
   */
  const [form, setForm] = useState<CreateLeagueForm>(DEFAULT_FORM);

  /**
   * Cada vez que el modal se abre, reseteamos el formulario
   * para empezar limpio.
   */
  useEffect(() => {
    if (visible) {
      setForm(DEFAULT_FORM);
    }
  }, [visible]);

  /**
   * Actualizador genérico de campos.
   */
  const update = useCallback(
    <K extends keyof CreateLeagueForm>(key: K, value: CreateLeagueForm[K]) => {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  /**
   * Disminuye un valor numérico sin bajar de 0.
   */
  const decrease = useCallback(
    (key: keyof CreateLeagueForm) => {
      setForm((prev) => ({
        ...prev,
        [key]:
          typeof prev[key] === 'number'
            ? Math.max(0, (prev[key] as number) - 1)
            : prev[key],
      }));
    },
    []
  );

  /**
   * Aumenta un valor numérico.
   */
  const increase = useCallback((key: keyof CreateLeagueForm) => {
    setForm((prev) => ({
      ...prev,
      [key]:
        typeof prev[key] === 'number'
          ? ((prev[key] as number) + 1)
          : prev[key],
    }));
  }, []);

  /**
   * Validación mínima antes de guardar.
   * Aquí puedes endurecer reglas si quieres.
   */
  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      Alert.alert('Falta información', 'Introduce un nombre para la liga.');
      return;
    }

    if (!form.season.trim()) {
      Alert.alert('Falta información', 'Introduce la temporada.');
      return;
    }

    if (form.maxTeams < form.minTeams) {
      Alert.alert(
        'Valores no válidos',
        'El máximo de equipos no puede ser menor que el mínimo.'
      );
      return;
    }

    if (form.maxConvocados < form.minConvocados) {
      Alert.alert(
        'Valores no válidos',
        'El máximo de convocados no puede ser menor que el mínimo.'
      );
      return;
    }

    if (form.maxPlatilla < form.minPlatilla) {
      Alert.alert(
        'Valores no válidos',
        'El máximo de plantilla no puede ser menor que el mínimo.'
      );
      return;
    }

    onConfirm(form);
  }, [form, onConfirm]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Overlay general */}
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
        {/* Evitamos que pulsar dentro cierre el modal */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
            backgroundColor: Colors.bg.surface1,
            maxHeight: '88%',
            overflow: 'hidden',
          }}
        >
          {/* Cabecera del modal */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: Colors.bg.surface2,
            }}
          >
            <Text
              style={{
                color: Colors.text.primary,
                fontSize: theme.fontSize.xxl,
                lineHeight: 30,
                fontWeight: '700',
              }}
            >
              Crear nueva liga
            </Text>

            <TouchableOpacity onPress={onCancel} activeOpacity={0.85}>
              <Ionicons
                name="close"
                size={22}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Contenido scrolleable */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 20,
            }}
          >
            {/* Nombre */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: Colors.text.secondary,
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                Nombre de la liga
              </Text>

              <TextInput
                value={form.name}
                onChangeText={(t) => update('name', t)}
                placeholder="Ej. Liga Sevilla Premier"
                placeholderTextColor={Colors.text.disabled}
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
              />
            </View>

            {/* Temporada + Categoría */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              {/* Temporada como texto con formato controlado */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: Colors.text.secondary,
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                >
                  Temporada
                </Text>

                <TextInput
                  placeholder="2025/26"
                  placeholderTextColor={Colors.text.disabled}
                  value={form.season}
                  onChangeText={(t) => update('season', formatSeasonInput(t))}
                  keyboardType="number-pad"
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
                />
              </View>

              {/* Categoría como select real */}
              <OptionSelectField
                label="Categoría"
                value={form.category}
                options={CATEGORY_OPTIONS}
                placeholder="Selecciona categoría"
                onChange={(value: string) => update('category', value)}
              />
            </View>

            {/* Equipos */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <StepperField
                label="Mínimo equipos"
                value={form.minTeams}
                onIncrement={() => increase('minTeams')}
                onDecrement={() => decrease('minTeams')}
              />

              <StepperField
                label="Máximo equipos"
                value={form.maxTeams}
                onIncrement={() => increase('maxTeams')}
                onDecrement={() => decrease('maxTeams')}
              />
            </View>

            {/* Convocados */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <StepperField
                label="Mín. convocados"
                value={form.minConvocados}
                onIncrement={() => increase('minConvocados')}
                onDecrement={() => decrease('minConvocados')}
              />

              <StepperField
                label="Máx. convocados"
                value={form.maxConvocados}
                onIncrement={() => increase('maxConvocados')}
                onDecrement={() => decrease('maxConvocados')}
              />
            </View>

            {/* Plantilla */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <StepperField
                label="Mín. plantilla"
                value={form.minPlatilla}
                onIncrement={() => increase('minPlatilla')}
                onDecrement={() => decrease('minPlatilla')}
              />

              <StepperField
                label="Máx. plantilla"
                value={form.maxPlatilla}
                onIncrement={() => increase('maxPlatilla')}
                onDecrement={() => decrease('maxPlatilla')}
              />
            </View>

            {/* Partido */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 6 }}>
              <StepperField
                label="Minutos por partido"
                value={form.matchMinutes}
                onIncrement={() => increase('matchMinutes')}
                onDecrement={() => decrease('matchMinutes')}
              />

              <StepperField
                label="Máx. partidos"
                value={form.maxMatches}
                onIncrement={() => increase('maxMatches')}
                onDecrement={() => decrease('maxMatches')}
              />
            </View>
          </ScrollView>

          {/* Footer de acciones */}
          <View
            style={{
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: Colors.bg.surface2,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.9}
              style={{
                height: 48,
                paddingHorizontal: 18,
                borderRadius: 14,
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
              onPress={handleSubmit}
              activeOpacity={0.9}
              style={{
                height: 48,
                paddingHorizontal: 18,
                borderRadius: 14,
                justifyContent: 'center',
                backgroundColor: Colors.brand.primary,
              }}
            >
              <Text
                style={{
                  color: Colors.bg.base,
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                Crear liga
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const CreateLeagueModal = memo(CreateLeagueModalComponent);