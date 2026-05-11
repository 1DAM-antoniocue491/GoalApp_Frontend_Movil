/** Modal de confirmación para iniciar partido. */

import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { MatchModalActions, MatchModalButton, MatchModalShell } from './MatchModalShell';

export interface ProgrammedMatchContext {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date?: string;
  time?: string;
  venue?: string;
}

interface StartMatchModalProps {
  visible: boolean;
  match: ProgrammedMatchContext | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function MatchDetailRow({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 10 }}>
      <View className="items-center justify-center" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg.surface1 }}>
        <Ionicons name={icon} size={15} color={Colors.text.secondary} />
      </View>
      <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm }}>{value}</Text>
    </View>
  );
}

function StartMatchModalComponent({ visible, match, onConfirm, onCancel, isSubmitting = false }: StartMatchModalProps) {
  return (
    <MatchModalShell
      visible={visible}
      title="Iniciar partido"
      subtitle="El partido pasará a estado EN VIVO inmediatamente."
      icon="play-circle"
      iconColor={Colors.brand.primary}
      pending={isSubmitting}
      onClose={onCancel}
      footer={
        <MatchModalActions>
          <MatchModalButton label="Cancelar" variant="secondary" disabled={isSubmitting} onPress={onCancel} />
          <MatchModalButton label="Iniciar" variant="primary" icon="play-circle-outline" loading={isSubmitting} disabled={isSubmitting} onPress={onConfirm} />
        </MatchModalActions>
      }
    >
      {match ? (
        <View style={{ backgroundColor: Colors.bg.surface2, borderRadius: theme.borderRadius.lg, padding: 18, gap: 14 }}>
          <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
            <Text numberOfLines={2} style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' }}>{match.homeTeam}</Text>
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.bg.surface1 }}>
              <Text style={{ color: Colors.text.disabled, fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>VS</Text>
            </View>
            <Text numberOfLines={2} style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' }}>{match.awayTeam}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: Colors.bg.surface1 }} />
          <View style={{ gap: 10 }}>
            {(match.date || match.time) ? <MatchDetailRow icon="calendar-outline" value={[match.date, match.time].filter(Boolean).join(' · ')} /> : null}
            {match.venue ? <MatchDetailRow icon="location-outline" value={match.venue} /> : null}
          </View>
        </View>
      ) : null}
    </MatchModalShell>
  );
}

export const StartMatchModal = memo(StartMatchModalComponent);
