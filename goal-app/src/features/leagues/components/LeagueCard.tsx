import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { StatusDotLabel } from '@/src/shared/components/ui/StatusDotLabel';
import { RoleBadge } from '@/src/shared/components/ui/RoleBadge';
import { PrimaryPillButton } from '@/src/shared/components/ui/PrimaryPillButton';

/**
 * Tipos del dominio de liga.
 * Si ya los tienes en shared/types/league.ts,
 * mantén allí la source of truth y elimina esta duplicidad.
 */
export type LeagueRole = 'admin' | 'coach' | 'player' | 'field_delegate';
export type LeagueStatus = 'active' | 'finished';

export interface LeagueItem {
  id: string;
  name: string;
  season: string;
  status: LeagueStatus;
  role: LeagueRole;
  isFavorite: boolean;
  teamName?: string;
  teamsCount: number;
  crestUrl?: string | null;
  canReactivate?: boolean;
}

interface LeagueCardProps {
  league: LeagueItem;
  onPress?: (league: LeagueItem) => void;
  onToggleFavorite?: (leagueId: string) => void;
  onPressSettings?: (league: LeagueItem) => void;
}

/**
 * Configuración visual de cada rol.
 *
 * Aquí centralizamos:
 * - label
 * - color de fondo del badge
 * - color del texto
 * - icono
 *
 * Esto evita repetir reglas visuales del rol por toda la UI.
 */
const ROLE_CONFIG: Record<
  LeagueRole,
  {
    label: string;
    bg: string;
    text: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  admin: {
    label: 'Admin',
    bg: '#4B3B05',
    text: Colors.semantic.warning,
    icon: 'shield-checkmark-outline',
  },
  coach: {
    label: 'Entrenador',
    bg: '#0A3E66',
    text: Colors.brand.accent,
    icon: 'people-outline',
  },
  field_delegate: {
    label: 'Delegado de campo',
    bg: '#4B0F4D',
    text: '#D946EF',
    icon: 'ellipse-outline',
  },
  player: {
    label: 'Jugador',
    bg: '#0E4A3D',
    text: '#20E3B2',
    icon: 'football-outline',
  },
};

/**
 * Botón de favorito.
 *
 * Se deja dentro del archivo porque es una pieza
 * muy ligada a esta card concreta.
 * Si luego repites este patrón en muchas zonas,
 * entonces sí conviene extraerlo a shared/ui.
 */
function FavoriteButton({
  isFavorite,
  onPress,
}: {
  isFavorite: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-10 h-10 items-center justify-center"
    >
      <Ionicons
        name={isFavorite ? 'star' : 'star-outline'}
        size={22}
        /**
         * Amarillo si es favorita,
         * gris si no lo es.
         */
        color={isFavorite ? '#FFC700' : Colors.text.disabled}
      />
    </TouchableOpacity>
  );
}

/**
 * Escudo o fallback visual.
 *
 * Regla del producto:
 * si no hay imagen, mostramos un escudo por defecto
 * con bordes blancos y nunca dejamos el hueco vacío.
 */
function LeagueCrest({ crestUrl }: { crestUrl?: string | null }) {
  return (
    <View
      /**
       * className aquí se usa para la forma:
       * - tamaño
       * - círculo
       * - centrado
       * - overflow hidden para la imagen
       *
       * style se usa para colores de fondo/borde,
       * porque dependen del design system y es más legible
       * dejarlos aquí con Colors.
       */
      className="w-16 h-16 rounded-full items-center justify-center border overflow-hidden"
      style={{
        backgroundColor: Colors.bg.base,
        borderColor: Colors.bg.surface2,
      }}
    >
      {crestUrl ? (
        <Image
          source={{ uri: crestUrl }}
          /**
           * style se usa aquí porque React Native maneja mejor
           * medidas exactas de imagen por style inline.
           */
          style={{ width: 33, height: 33 }}
          resizeMode="contain"
        />
      ) : (
        <Ionicons
          name="shield-outline"
          size={30}
          color={Colors.text.primary}
        />
      )}
    </View>
  );
}

/**
 * Bloque de información secundaria.
 *
 * Ejemplos:
 * - Mi equipo
 * - Equipos en la liga
 */
function InfoStatRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}) {
  return (
    <View className="flex-1 justify-between">
      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: theme.fontSize.sm - 1,
          lineHeight: 16,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      <View className="flex-row items-center ">
        <Ionicons
          name={icon}
          size={16}
          color={Colors.text.secondary}
          style={{ marginRight: 6 }}
        />

        <Text
          style={{
            color: Colors.text.primary,
            fontSize: theme.fontSize.sm,
            lineHeight: 20,
            fontWeight: '500',
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function LeagueCardComponent({
  league,
  onPress,
  onToggleFavorite,
  onPressSettings,
}: LeagueCardProps) {
  /**
   * Flags derivados del estado de la liga.
   */
  const isFinished = league.status === 'finished';
  const canReactivate = !!league.canReactivate;
  const isDisabled = isFinished && !canReactivate;
  const primaryLabel = isFinished ? 'Reactivar liga' : 'Entrar';

  /**
   * Configuración visual del rol actual.
   */
  const roleConfig = ROLE_CONFIG[league.role];

  return (
    <View
      /**
       * className se usa para la estructura fija:
       * - margen inferior
       * - borde
       * - padding
       *
       * style se usa para:
       * - fondo
       * - color de borde
       * - radio exacto
       * - sombra
       *
       * La sombra en React Native necesita style.
       */
      className="mb-2 border p-4"
      style={{
        backgroundColor: Colors.bg.surface1,
        borderColor: Colors.bg.surface2,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
      }}
    >
      {/* Parte superior:
          badge de rol arriba izquierda
          favorito arriba derecha */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center">
          <RoleBadge
            label={roleConfig.label}
            bgColor={roleConfig.bg}
            textColor={roleConfig.text}
            icon={roleConfig.icon}
          />

          {/* El engranaje solo aparece si el rol dentro de la liga es admin */}
          {league.role === 'admin' && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onPressSettings?.(league)}
              className="ml-2 w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: Colors.bg.surface2 }}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <FavoriteButton
          isFavorite={league.isFavorite}
          onPress={() => onToggleFavorite?.(league.id)}
        />
      </View>

      {/* Contenido principal:
          escudo a la izquierda
          nombre, temporada y estado a la derecha */}
      <View className="flex-row items-center mb-3">
        <LeagueCrest crestUrl={league.crestUrl} />

        <View className="flex-1 ml-4">
          <Text
            style={{
              color: Colors.text.primary,
              fontSize: 16,
              lineHeight: 18,
              fontWeight: '700',

            }}
            numberOfLines={2}
          >
            {league.name}
          </Text>

          <View className="flex-row items-center mt-2 flex-wrap">
            <Text
              style={{
                color: Colors.text.secondary,
                fontSize: theme.fontSize.sm,
                lineHeight: 20,
              }}
            >
              Temporada {league.season}
            </Text>

            <Text
              style={{
                color: Colors.text.secondary,
                marginHorizontal: 8,
                fontSize: theme.fontSize.sm - 2,
              }}
            >
              |
            </Text>

            <StatusDotLabel
              label={isFinished ? 'Finalizada' : 'Activa'}
              color={isFinished ? Colors.semantic.error : Colors.semantic.success}
            />
          </View>
        </View>
      </View>

      {/* Información secundaria en dos columnas */}
      <View className="flex-row mb-6">
        <View className="flex-1 pr-3">
          <InfoStatRow
            icon="shield-outline"
            label="Mi equipo"
            value={league.teamName ?? 'Sin asignar'}
          />
        </View>

        <View>
          <InfoStatRow
            icon="people-outline"
            label="Equipos en la liga"
            value={league.teamsCount}
          />
        </View>
      </View>

      {/* Acción principal:
          - Entrar si activa
          - Reactivar liga si finalizada y puede gestionarla
          - deshabilitado si finalizada sin permisos */}
      <PrimaryPillButton
        label={primaryLabel}
        disabled={isDisabled}
        onPress={() => {
          if (!isDisabled) {
            onPress?.(league);
          }
        }}
        minWidth={0}
        height={50}
        /**
         * style se usa aquí porque queremos forzar el ancho total
         * y un radio concreto para esta card.
         * Esto es más claro que meter hacks en className.
         */
        style={{ width: '100%', borderRadius: 20 }}
      />
    </View>
  );
}

export const LeagueCard = memo(LeagueCardComponent);