import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
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
import { getRoleBadgeConfig } from '@/src/shared/utils/roles';
import type { LeagueItem } from '@/src/shared/types/league';

interface LeagueCardProps {
  league: LeagueItem;
  onPress?: (league: LeagueItem) => void | Promise<void>;
  onToggleFavorite?: (leagueId: string) => void | Promise<void>;
  onPressSettings?: (league: LeagueItem) => void;
}

/**
 * La configuración visual del rol se obtiene desde shared/utils/roles.
 * Así la tarjeta de liga y Usuarios/Roles muestran exactamente el mismo badge.
 */
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
  disabled,
  onPress,
}: {
  isFavorite: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      className="w-10 h-10 items-center justify-center"
      style={{ opacity: disabled ? 0.45 : 1 }}
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
 * - admin / observer → solo ven total de equipos. No pertenecen a un equipo concreto.
 * - coach / player / field_delegate → ven su equipo asignado + total de equipos.
 */
function getLeagueCardInfoBlocks(league: LeagueItem): CardInfoBlock[] {
  const teamsBlock: CardInfoBlock = {
    icon: 'people-outline',
    label: 'Equipos',
    value: league.teamsCount,
  };

  if (league.role === 'admin' || league.role === 'observer') {
    return [teamsBlock];
  }

  // coach / player / field_delegate tienen equipo asignado
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
   * Bloqueo local de interacción.
   *
   * Al pulsar "Entrar" o "Reactivar liga", la app puede tardar en navegar
   * porque debe guardar la liga activa, hidratar datos del dashboard y resolver red.
   * Durante ese intervalo bloqueamos favorito/configuración/acción principal para
   * evitar dobles taps o acciones cruzadas sobre la misma tarjeta.
   *
   * El mismo bloqueo se aplica cuando se pulsa la estrella de favorito.
   * Favorito persiste contra API, así que no dejamos que el usuario entre,
   * reactive o abra configuración mientras esa petición sigue viva.
   */
  const [isSelecting, setIsSelecting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Ejecuta la acción principal de forma segura.
   *
   * Si el padre devuelve una promesa, esperamos a que termine. Si solo dispara
   * navegación síncrona, mantenemos un bloqueo breve para absorber taps repetidos
   * mientras Expo Router completa el cambio de pantalla.
   */
  const handlePrimaryPress = useCallback(async () => {
    if (isSelecting) return;

    setIsSelecting(true);

    try {
      await onPress?.(league);
    } finally {
      unlockTimeoutRef.current = setTimeout(() => {
        setIsSelecting(false);
      }, 1200);
    }
  }, [isSelecting, league, onPress]);

  /**
   * Alterna favorito de forma segura.
   *
   * Bloquea el resto de acciones mientras el padre llama a la API
   * para evitar inconsistencias como entrar en una liga mientras la
   * estrella todavía se está guardando en backend.
   */
  const handleFavoritePress = useCallback(async () => {
    if (isSelecting || isTogglingFavorite) return;

    setIsTogglingFavorite(true);

    try {
      await onToggleFavorite?.(league.id);
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isSelecting, isTogglingFavorite, league.id, onToggleFavorite]);

  /**
   * Flags derivados del estado de la liga.
   */
  const isFinished = league.status === 'finished';
  const canReactivate = !!league.canReactivate;
  const isDisabled = isFinished && !canReactivate;
  const actionsLocked = isSelecting || isTogglingFavorite;
  const primaryLabel = isSelecting
    ? isFinished
      ? 'Reactivando...'
      : 'Entrando...'
    : isFinished
      ? 'Reactivar liga'
      : 'Entrar';

  /**
   * Configuración visual del rol actual.
   */
  const roleConfig = getRoleBadgeConfig(league.role);

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
        opacity: actionsLocked ? 0.78 : 1,
      }}
    >
      {/* Parte superior:
          badge de rol arriba izquierda
          favorito arriba derecha */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center">
          {/*
           * RoleBadge recibe directamente bgColor/textColor de getRoleBadgeConfig,
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
              disabled={actionsLocked}
              onPress={() => {
                if (!actionsLocked) {
                  onPressSettings?.(league);
                }
              }}
              className="ml-2 w-9 h-9 rounded-xl items-center justify-center"
              style={{
                backgroundColor: Colors.bg.surface2,
                opacity: actionsLocked ? 0.45 : 1,
              }}
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
          disabled={actionsLocked}
          onPress={handleFavoritePress}
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
              marginVertical: 10,
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
        disabled={isDisabled || actionsLocked}
        onPress={() => {
          if (!isDisabled && !actionsLocked) {
            handlePrimaryPress();
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