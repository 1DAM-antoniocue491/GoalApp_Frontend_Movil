/**
 * TeamCard.tsx
 *
 * Card premium para mostrar un equipo en la lista.
 * onPress → navegar al detalle.
 * onLongPress → abrir menú de acciones (editar / eliminar).
 *
 * IMPORTANTE:
 * Este componente es únicamente visual/interactivo.
 * No hace llamadas a la API, no modifica datos y no cambia la navegación existente.
 */

import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/src/shared/constants/colors";
import { theme } from "@/src/shared/styles/theme";
import { getTeamColor, getTeamName } from "../types/teams.types";
import type { EquipoResponse } from "../types/teams.types";

export interface TeamCardProps {
  team: EquipoResponse;
  onPress: (teamId: number) => void;
  onLongPress?: (team: EquipoResponse) => void;
}

function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");

  if (hex.length !== 6) {
    return Colors.bg.surface2;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getOptionalTeamText(team: EquipoResponse): string {
  /**
   * Algunos proyectos/backend pueden devolver ciudad o estadio.
   * No se usan como requisito funcional: solo se muestran si existen.
   */
  const candidate = team as EquipoResponse & {
    ciudad?: string | null;
    estadio?: string | null;
  };

  if (candidate.ciudad?.trim()) return candidate.ciudad.trim();
  if (candidate.estadio?.trim()) return candidate.estadio.trim();

  return "Mantén pulsado para acciones";
}

export function TeamCard({ team, onPress, onLongPress }: TeamCardProps) {
  const name = getTeamName(team);
  const initial = name.charAt(0).toUpperCase();
  const teamColor = getTeamColor(team);
  const shieldUri =
    typeof team.escudo === "string" && team.escudo.trim().length > 0
      ? team.escudo.trim()
      : null;

  const activeValue = (team as EquipoResponse & { activo?: boolean }).activo;
  const isActive = activeValue !== false;
  const subtitle = getOptionalTeamText(team);

  return (
    <TouchableOpacity
      style={styles.touchArea}
      onPress={() => onPress(team.id_equipo)}
      onLongPress={() => onLongPress?.(team)}
      delayLongPress={350}
      activeOpacity={0.84}
    >
      <View style={[styles.card, { borderColor: withAlpha(teamColor, 0.18) }]}>
        {/* Acento visual del equipo. No afecta a la lógica ni al payload. */}
        <View
          style={[
            styles.accentGlow,
            { backgroundColor: withAlpha(teamColor, 0.16) },
          ]}
        />
        <View style={[styles.accentBar, { backgroundColor: teamColor }]} />

        {/* Escudo o inicial del equipo. */}
        <View
          style={[
            styles.shield,
            {
              borderColor: withAlpha(teamColor, 0.64),
              backgroundColor: withAlpha(teamColor, 0.12),
            },
          ]}
        >
          {shieldUri ? (
            <Image
              source={{ uri: shieldUri }}
              style={styles.shieldImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={[styles.shieldLetter, { color: teamColor }]}>
              {initial}
            </Text>
          )}
        </View>

        {/* Información principal del equipo. */}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>

            <View
              style={[
                styles.statusPill,
                isActive ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isActive
                      ? Colors.semantic.success
                      : Colors.text.disabled,
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {isActive ? "Activo" : "Inactivo"}
              </Text>
            </View>
          </View>

          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>


      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
  },
  card: {
    position: "relative",
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: Colors.bg.surface1,
    paddingVertical: theme.spacing.lg,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.md,
    gap: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  accentGlow: {
    position: "absolute",
    left: -32,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    borderTopRightRadius: theme.borderRadius.full,
    borderBottomRightRadius: theme.borderRadius.full,
  },
  shield: {
    width: 58,
    height: 58,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shieldImage: {
    width: "100%",
    height: "100%",
  },
  shieldLetter: {
    fontSize: theme.fontSize.xl,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  name: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: "800",
    letterSpacing: 0.15,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.xs,
    lineHeight: 17,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
  },
  statusActive: {
    borderColor: withAlpha(Colors.semantic.success, 0.32),
    backgroundColor: withAlpha(Colors.semantic.success, 0.1),
  },
  statusInactive: {
    borderColor: withAlpha(Colors.text.disabled, 0.4),
    backgroundColor: withAlpha(Colors.text.disabled, 0.12),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: "700",
  }
});
