/**
 * JourneyNavigator.tsx
 *
 * Navegador de jornada:  < JORNADA 28 | TEMPORADA 2025-2026 >
 *
 * - Flecha izquierda: jornada anterior (deshabilitada en la primera)
 * - Texto central: número de jornada y temporada
 * - Flecha derecha: jornada siguiente (deshabilitada en la última)
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface JourneyNavigatorProps {
  journeyNumber: number;
  totalJourneys: number;
  season: string;
  onPrev: () => void;
  onNext: () => void;
}

export function JourneyNavigator({
  journeyNumber,
  totalJourneys,
  season,
  onPrev,
  onNext,
}: JourneyNavigatorProps) {
  const isFirst = journeyNumber <= 1;
  const isLast = journeyNumber >= totalJourneys;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        backgroundColor: Colors.bg.surface1,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.bg.surface2,
      }}
    >
      {/* ── Flecha anterior ── */}
      <Pressable
        onPress={onPrev}
        disabled={isFirst}
        hitSlop={12}
        style={{ opacity: isFirst ? 0.25 : 1, padding: 4 }}
        accessibilityRole="button"
        accessibilityLabel="Jornada anterior"
        accessibilityState={{ disabled: isFirst }}
      >
        <Ionicons name="chevron-back" size={22} color={Colors.text.primary} />
      </Pressable>

      {/* ── Texto central ── */}
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text
          style={{
            color: Colors.text.primary,
            fontSize: theme.fontSize.sm,
            fontWeight: '700',
            letterSpacing: 1.2,
          }}
        >
          JORNADA {journeyNumber}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Text style={{ color: Colors.text.disabled, fontSize: 10, letterSpacing: 0.5 }}>
            TEMPORADA {season}
          </Text>
        </View>
      </View>

      {/* ── Flecha siguiente ── */}
      <Pressable
        onPress={onNext}
        disabled={isLast}
        hitSlop={12}
        style={{ opacity: isLast ? 0.25 : 1, padding: 4 }}
        accessibilityRole="button"
        accessibilityLabel="Jornada siguiente"
        accessibilityState={{ disabled: isLast }}
      >
        <Ionicons name="chevron-forward" size={22} color={Colors.text.primary} />
      </Pressable>
    </View>
  );
}
