import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { StatusDotLabel } from '@/src/shared/components/ui/StatusDotLabel';
import { RoleBadge } from '@/src/shared/components/ui/RoleBadge';
import { PrimaryPillButton } from '@/src/shared/components/ui/PrimaryPillButton';
/**
 * Tipos importados desde shared/types/league — fuente de verdad única.
 * No se duplican aquí para evitar divergencias entre la card y el resto de la app.
 */
import type { LeagueRole, LeagueItem } from '@/src/shared/types/league';

interface LeagueCardProps {
  league: LeagueItem;
  onPress?: (league: LeagueItem) => void;
  onToggleFavorite?: (leagueId: string) => void;
  onPressSettings?: (league: LeagueItem) => void;
}

/**
 * Configuración visual de cada rol.
 *
 * Alineada con UserRowCard.ROLE_CONFIG para mantener consistencia visual
 * en toda la app. RoleBadge es la única fuente de verdad visual del rol:
 * no se definen colores, iconos ni labels fuera de este mapa.
 *
 * Claves bgColor/textColor coinciden con las props de RoleBadge
 * para evitar renombrados intermedios.
 *
 * Colores: rgba() con transparencia baja, igual que UserRowCard,
 * para mantener el estilo premium dark sin fondos opacos.
 *
 * field_delegate conserva el label "Delegado de campo" porque en el
 * contexto de liga ese rol es más específico que el "Delegado" de usuarios.
 * Icono y colores sí son idénticos al delegate de UserRowCard.
 */
const ROLE_CONFIG: Record<
  LeagueRole,
  {
    label: string;
    bgColor: string;
    textColor: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  admin: {
    label: 'Administrador',
    bgColor: 'rgba(200,245,88,0.15)',
    textColor: Colors.brand.primary,
    icon: 'shield-outline',
  },
  coach: {
    label: 'Entrenador',
    bgColor: 'rgba(0,180,216,0.15)',
    textColor: Colors.brand.secondary,
    icon: 'ribbon-outline',
  },
  field_delegate: {
    label: 'Delegado de campo',
    bgColor: 'rgba(255,214,10,0.15)',
    textColor: Colors.semantic.warning,
    icon: 'clipboard-outline',
  },
  player: {
    label: 'Jugador',
    bgColor: 'rgba(24,162,251,0.15)',
    textColor: Colors.brand.accent,
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
 * Bloque de información secundaria (icono + label + valor).
 * Ocupa el espacio disponible dentro del flex-row padre.
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
    <View style={{ flex: 1 }}>
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

      <View className="flex-row items-center">
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

/** Descriptor de un bloque de info secundaria en la card. */
interface CardInfoBlock {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}

/**
 * Determina qué bloques de información mostrar según el rol del usuario.
 *
 * Reglas de negocio:
 * - admin → solo ve total de equipos. Gestiona la liga, no pertenece a un equipo.
 * - coach / player / field_delegate → ven su equipo asignado + total de equipos.
 *
 * Si en el futuro se añade el rol 'observer' a LeagueRole, basta con añadirlo
 * al mismo bloque que admin (sin equipo asignado).
 */
function getLeagueCardInfoBlocks(league: LeagueItem): CardInfoBlock[] {
  const teamsBlock: CardInfoBlock = {
    icon: 'people-outline',
    label: 'Equipos',
    value: league.teamsCount,
  };

  if (league.role === 'admin') {
    // Admin ve solo el global de equipos
    return [teamsBlock];
  }

  // El resto de roles tienen equipo asignado en la liga
  return [
    {
      icon: 'shield-outline',
      label: 'Mi equipo',
      value: league.teamName ?? 'Sin asignar',
    },
    teamsBlock,
  ];
}

function LeagueCardComponent({
  league,
  onPress,
  onToggleFavorite,
  onPressSettings,
}: LeagueCardProps) {
  /**
   * Flags derivados del estado de la <liga className="7"></liga>
   */
  const isFinished = league.status === 'finished';
  const canReactivate = !!league.canReactivate;
  const isDisabled = isFinished && !canReactivate;
  const primaryLabel = isFinished ? 'Reactivar liga' : 'Entrar';

  /**
   * Configuración visual del rol actual.
   */
  const roleConfig = ROLE_CONFIG[league.role];

  /**
   * Bloques de información secundaria condicionados al rol.
   * La función encapsula todas las reglas de qué mostrar —
   * el JSX se limita a renderizar sin if/else embebidos.
   */
  const infoBlocks = getLeagueCardInfoBlocks(league);

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
          {/*
           * RoleBadge recibe directamente bgColor/textColor de ROLE_CONFIG,
           * que ya usa las mismas claves que las props del componente.
           * No hay transformación intermedia ni estilos externos.
           */}
          <RoleBadge
            label={roleConfig.label}
            bgColor={roleConfig.bgColor}
            textColor={roleConfig.textColor}
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

          {/*
       * Información secundaria según rol.
       * getLeagueCardInfoBlocks decide qué bloques mostrar:
       * - admin → solo "Equipos"
       * - resto → "Mi equipo" + "Equipos"
       * Cada bloque ocupa espacio igual gracias al flex:1 de InfoStatRow.
       */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginVertical: 14,
              paddingTop: 5, 
              borderTopWidth: 1, borderTopColor: Colors.bg.surface2
            }}
          >
            {infoBlocks.map((block) => (
              <InfoStatRow
                key={block.label}
                icon={block.icon}
                label={block.label}
                value={block.value}
              />
            ))}
          </View>
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