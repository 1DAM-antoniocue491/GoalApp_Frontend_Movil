/**
 * LiveMatchCard
 *
 * Tarjeta única para partidos en vivo en dashboard, calendario y pantalla /matches/live.
 * Se basa en la tarjeta que funcionaba correctamente en LiveMatchesScreen:
 * marcador claro, minuto actual y minuto máximo configurado de liga.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { routes } from '@/src/shared/config/routes';
import { Colors } from '@/src/shared/constants/colors';
import type { LiveMatchData } from '@/src/shared/types/dashboard.types';
import type { DashboardPermissions } from '@/src/features/dashboard/services/dashboardService';

type LiveCardMatch = LiveMatchData & {
  duration?: number | null;
  startedAt?: string | null;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  eventsLocked?: boolean;
};

interface LiveMatchCardProps {
  match: LiveCardMatch;
  permissions: DashboardPermissions;
  onRegisterEvent?: (matchId: string) => void;
  onEndMatch?: (matchId: string) => void;
  actionsDisabled?: boolean;
}

function parseLiteralTimestamp(raw?: string | null): number | null {
  if (!raw) return null;
  const clean = String(raw).trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, year, month, day, hour = '00', minute = '00'] = match;
  const ts = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0, 0).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function sanitizeDuration(value?: number | null): number {
  const parsed = Number(value ?? 90);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 90;
}

function getVisualMinute(match: LiveCardMatch, tick: number) {
  const duration = sanitizeDuration(match.duration);
  const started = parseLiteralTimestamp(match.startedAt);

  if (started != null) {
    const rawElapsed = Math.floor((Date.now() - started) / 60000) + 1 + tick * 0;
    const minute = Math.max(1, Math.min(duration, rawElapsed));
    return { minute, duration, expired: rawElapsed >= duration };
  }

  const explicit = Number(match.minute ?? 1);
  const safeExplicit = Number.isFinite(explicit) ? Math.floor(explicit) : 1;
  const minute = Math.max(1, Math.min(duration, safeExplicit));
  return { minute, duration, expired: safeExplicit >= duration || Boolean(match.eventsLocked) };
}

function TeamName({ children, align = 'left' }: { children: string; align?: 'left' | 'right' }) {
  return (
    <Text
      numberOfLines={2}
      style={{
        color: Colors.text.primary,
        fontSize: 16,
        lineHeight: 20,
        fontWeight: '800',
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  disabled,
  primary,
  danger,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  const backgroundColor = disabled
    ? Colors.bg.surface2
    : danger
      ? `${Colors.semantic.error}22`
      : primary
        ? Colors.brand.primary
        : Colors.bg.surface2;
  const textColor = disabled
    ? Colors.text.disabled
    : danger
      ? Colors.semantic.error
      : primary
        ? Colors.bg.base
        : Colors.text.primary;

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.86}
      style={{
        flexGrow: 1,
        minWidth: '30%',
        height: 44,
        borderRadius: 14,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity: disabled ? 0.58 : 1,
      }}
    >
      <Ionicons name={icon} size={18} color={textColor} />
      <Text style={{ color: textColor, fontWeight: '900', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function LiveMatchCard({
  match,
  permissions,
  onRegisterEvent,
  onEndMatch,
  actionsDisabled = false,
}: LiveMatchCardProps) {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const { minute, duration, expired } = useMemo(() => getVisualMinute(match, tick), [match, tick]);
  const eventLocked = actionsDisabled || expired || Boolean(match.eventsLocked);

  return (
    <Pressable
      style={{
        backgroundColor: Colors.bg.surface1,
        borderRadius: 24,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: expired ? `${Colors.semantic.warning}88` : `${Colors.brand.primary}45`,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Animated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: Colors.brand.primary,
              opacity: pulse,
            }}
          />
          <Text style={{ color: Colors.brand.primary, fontWeight: '900', letterSpacing: 0.8 }}>EN VIVO</Text>
        </View>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 5,
            backgroundColor: expired ? `${Colors.semantic.warning}22` : Colors.brand.primary,
          }}
        >
          <Text style={{ color: expired ? Colors.semantic.warning : Colors.bg.base, fontWeight: '900' }}>
            {minute}' / {duration}'
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between" style={{ marginTop: 22, gap: 10 }}>
        <View className="flex-1">
          <TeamName>{match.homeTeam}</TeamName>
        </View>

        <View style={{ minWidth: 112, alignItems: 'center' }}>
          <Text
            style={{
              color: Colors.text.primary,
              fontSize: 34,
              lineHeight: 40,
              fontWeight: '900',
              letterSpacing: -1,
            }}
          >
            {match.homeScore ?? 0} - {match.awayScore ?? 0}
          </Text>
        </View>

        <View className="flex-1">
          <TeamName align="right">{match.awayTeam}</TeamName>
        </View>
      </View>

      {match.venue ? (
        <View className="flex-row items-center justify-center" style={{ gap: 5, marginTop: 14 }}>
          <Ionicons name="location-outline" size={13} color={Colors.text.disabled} />
          <Text numberOfLines={1} style={{ color: Colors.text.disabled, fontSize: 12 }}>{match.venue}</Text>
        </View>
      ) : null}

      {expired && permissions.canEndMatch ? (
        <View
          style={{
            marginTop: 16,
            borderRadius: 16,
            padding: 12,
            backgroundColor: `${Colors.semantic.warning}16`,
            borderWidth: 1,
            borderColor: `${Colors.semantic.warning}55`,
          }}
        >
          <Text style={{ color: Colors.semantic.warning, fontSize: 13, lineHeight: 18, fontWeight: '900', textAlign: 'center' }}>
            Finaliza el partido y escoge el MVP
          </Text>
        </View>
      ) : null}

      {(permissions.canViewLineups || permissions.canRegisterEvent || permissions.canEndMatch) ? (
        <View className="flex-row flex-wrap" style={{ gap: 10, marginTop: 18 }}>
          {permissions.canViewLineups ? (
            <ActionButton
              label="Plantillas"
              icon="people-outline"
              disabled={actionsDisabled}
              onPress={() => router.push(routes.private.matchRoutes.live.squad(match.id) as never)}
            />
          ) : null}

          {permissions.canRegisterEvent ? (
            <ActionButton
              label="Evento"
              icon="add-circle-outline"
              primary
              disabled={eventLocked}
              onPress={() => onRegisterEvent?.(match.id)}
            />
          ) : null}

          {permissions.canEndMatch ? (
            <ActionButton
              label="Finalizar"
              icon="checkmark-circle-outline"
              danger
              disabled={actionsDisabled}
              onPress={() => onEndMatch?.(match.id)}
            />
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
