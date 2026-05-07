import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { StatusDotLabel } from '@/src/shared/components/ui/StatusDotLabel';
import { RoleBadge } from '@/src/shared/components/ui/RoleBadge';
import { PrimaryPillButton } from '@/src/shared/components/ui/PrimaryPillButton';
import { getRoleBadgeConfig } from '@/src/shared/utils/roles';
import type { LeagueItem } from '@/src/shared/types/league';

interface LeagueCardProps {
  league: LeagueItem;
  onPress?: (league: LeagueItem) => void;
  onToggleFavorite?: (leagueId: string) => void;
  onPressSettings?: (league: LeagueItem) => void;
}

function FavoriteButton({ isFavorite, onPress }: { isFavorite: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} className="w-10 h-10 items-center justify-center">
      <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? '#FFC700' : Colors.text.disabled} />
    </TouchableOpacity>
  );
}

function LeagueCrest({ crestUrl }: { crestUrl?: string | null }) {
  return (
    <View
      className="w-16 h-16 rounded-full items-center justify-center border overflow-hidden"
      style={{ backgroundColor: Colors.bg.base, borderColor: Colors.bg.surface2 }}
    >
      {crestUrl ? (
        <Image source={{ uri: crestUrl }} style={{ width: 42, height: 42 }} resizeMode="contain" />
      ) : (
        <Ionicons name="shield-outline" size={30} color={Colors.text.primary} />
      )}
    </View>
  );
}

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
      <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm - 1, lineHeight: 16, marginBottom: 6 }}>
        {label}
      </Text>

      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color={Colors.text.secondary} style={{ marginRight: 6 }} />
        <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.sm, lineHeight: 20, fontWeight: '500' }} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

interface CardInfoBlock {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}

function getLeagueCardInfoBlocks(league: LeagueItem): CardInfoBlock[] {
  const teamsBlock: CardInfoBlock = {
    icon: 'people-outline',
    label: 'Equipos',
    value: league.teamsCount,
  };

  if (league.role === 'admin' || league.role === 'observer') {
    return [teamsBlock];
  }

  return [
    {
      icon: 'shield-outline',
      label: 'Mi equipo',
      value: league.teamName ?? 'Sin asignar',
    },
    teamsBlock,
  ];
}

function LeagueCardComponent({ league, onPress, onToggleFavorite, onPressSettings }: LeagueCardProps) {
  const isFinished = league.status === 'finished';
  const canReactivate = !!league.canReactivate;
  const isDisabled = isFinished && !canReactivate;
  const primaryLabel = isFinished ? 'Reactivar liga' : 'Entrar';
  const roleConfig = getRoleBadgeConfig(league.role);
  const infoBlocks = getLeagueCardInfoBlocks(league);

  return (
    <View
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
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center">
          <RoleBadge label={roleConfig.label} bgColor={roleConfig.bgColor} textColor={roleConfig.textColor} icon={roleConfig.icon} />

          {league.role === 'admin' && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onPressSettings?.(league)}
              className="ml-2 w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: Colors.bg.surface2 }}
            >
              <Ionicons name="settings-outline" size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <FavoriteButton isFavorite={league.isFavorite} onPress={() => onToggleFavorite?.(league.id)} />
      </View>

      <View className="flex-row items-center mb-3">
        <LeagueCrest crestUrl={league.crestUrl} />

        <View className="flex-1 ml-4">
          <Text style={{ color: Colors.text.primary, fontSize: 16, lineHeight: 20, fontWeight: '700' }} numberOfLines={2}>
            {league.name}
          </Text>

          <View className="flex-row items-center mt-2 flex-wrap">
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, lineHeight: 20 }}>
              Temporada {league.season}
            </Text>
            <Text style={{ color: Colors.text.secondary, marginHorizontal: 8, fontSize: theme.fontSize.sm - 2 }}>|</Text>
            <StatusDotLabel label={isFinished ? 'Finalizada' : 'Activa'} color={isFinished ? Colors.semantic.error : Colors.semantic.success} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginVertical: 10,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: Colors.bg.surface2,
            }}
          >
            {infoBlocks.map((block) => (
              <InfoStatRow key={block.label} icon={block.icon} label={block.label} value={block.value} />
            ))}
          </View>
        </View>
      </View>

      <PrimaryPillButton
        label={primaryLabel}
        disabled={isDisabled}
        onPress={() => {
          if (!isDisabled) onPress?.(league);
        }}
        minWidth={0}
        height={50}
        style={{ width: '100%', borderRadius: 20 }}
      />
    </View>
  );
}

export const LeagueCard = memo(LeagueCardComponent);
