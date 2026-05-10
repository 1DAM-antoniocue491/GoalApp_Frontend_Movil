/**
 * CalendarHeader.tsx
 *
 * Header premium de la pantalla de calendario.
 *
 * Muestra:
 * - Escudo/logo de la liga (imagen o fallback con inicial)
 * - Nombre de la liga
 * - Pill de temporada (no interactiva si hay una sola; preparada para selector si hay varias)
 * - Icono de menú contextual a la derecha
 *
 * TODO: cuando existan múltiples temporadas, convertir la pill en un
 * selector (bottom sheet) con la lista de temporadas disponibles.
 */

import React from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface CalendarHeaderProps {
  leagueName: string;
  season: string;
  /** require() de la imagen del escudo, o { uri: string } para URL remota */
  leagueLogo?: ImageSourcePropType;
  /**
   * Si hay más de una temporada disponible, la pill se convierte en selector.
   * Dejar false mientras no haya lógica de temporadas múltiples.
   */
  hasMultipleSeasons?: boolean;
  /**
   * Controla si el menú de tres puntos se renderiza.
   * No lo dejamos solo deshabilitado: para roles no administradores debe desaparecer
   * para evitar que parezca una acción disponible.
   */
  showMenu?: boolean;
  onMenuPress?: () => void;
  /** Solo se llama si hasMultipleSeasons === true */
  onSeasonPress?: () => void;
}

export function CalendarHeader({
  leagueName,
  season,
  leagueLogo,
  hasMultipleSeasons = false,
  showMenu = true,
  onMenuPress,
  onSeasonPress,
}: CalendarHeaderProps) {
  // El menú solo debe existir cuando hay permiso y una acción real asociada.
  // Así evitamos mostrar los tres puntos a usuarios que no pueden crear/editar calendario o partidos.
  const shouldRenderMenu = showMenu && typeof onMenuPress === 'function';

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg.base }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
        }}
      >
        {/* ── Escudo de la liga ── */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: Colors.brand.primary,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {leagueLogo ? (
            <Image
              source={leagueLogo}
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
            />
          ) : (
            // Fallback: inicial de la liga si no hay imagen
            <Text
              style={{
                color: "#000000",
                fontSize: theme.fontSize.md,
                fontWeight: '700',
              }}
            >
              {leagueName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* ── Nombre de liga y temporada ── */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: Colors.text.primary,
              fontSize: theme.fontSize.md,
              fontWeight: '700',
              lineHeight: 20,
            }}
            numberOfLines={1}
          >
            {leagueName}
          </Text>

          {/*
           * Pill de temporada.
           * Si hasMultipleSeasons: actúa como botón para abrir selector.
           * Si no: es solo un indicador visual no interactivo.
           */}
          <Pressable
            onPress={hasMultipleSeasons ? onSeasonPress : undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              marginTop: 4,
              gap: 3,
              backgroundColor: Colors.bg.surface1,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: theme.borderRadius.full,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
            }}
          >
            <Text
              style={{
                color: Colors.text.secondary,
                fontSize: 11,
                fontWeight: '500',
                letterSpacing: 0.3,
              }}
            >
              {season}
            </Text>
            {/* Chevron solo si hay varias temporadas disponibles */}
            {hasMultipleSeasons && (
              <Ionicons name="chevron-down" size={10} color={Colors.text.secondary} />
            )}
          </Pressable>
        </View>

        {/* ── Menú contextual ── */}
        {shouldRenderMenu && (
          <Pressable
            onPress={onMenuPress}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.bg.surface1,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: true, radius: 18 }}
            accessibilityRole="button"
            accessibilityLabel="Menú del calendario"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.text.primary} />
          </Pressable>
        )}
      </View>

      {/* ── Separador inferior ── */}
      <View style={{ height: 1, backgroundColor: Colors.bg.surface2 }} />
    </SafeAreaView>
  );
}
