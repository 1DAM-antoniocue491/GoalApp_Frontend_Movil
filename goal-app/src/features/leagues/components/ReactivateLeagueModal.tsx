import React, { memo } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface ReactivateLeagueModalProps {
  visible: boolean;
  leagueName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ReactivateLeagueModalComponent({
  visible,
  leagueName,
  onConfirm,
  onCancel,
}: ReactivateLeagueModalProps) {
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
        {/* Caja del modal */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
            backgroundColor: Colors.bg.surface1,
            padding: 20,
          }}
        >
          {/* Icono decorativo */}
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
            style={{
              backgroundColor: `${Colors.brand.primary}14`,
            }}
          >
            <Ionicons
              name="refresh-outline"
              size={26}
              color={Colors.brand.primary}
            />
          </View>

          {/* Título */}
          <Text
            style={{
              color: Colors.text.primary,
              fontSize: theme.fontSize.xxl,
              lineHeight: 30,
              fontWeight: '700',
            }}
          >
            Reactivar liga
          </Text>

          {/* Descripción */}
          <Text
            style={{
              color: Colors.text.secondary,
              fontSize: 15,
              lineHeight: 22,
              marginTop: 10,
            }}
          >
            Vas a reactivar la liga{' '}
            <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>
              {leagueName}
            </Text>
            . La liga volverá a aparecer como activa y conservará toda su
            información.
          </Text>

          {/* Botones */}
          <View
            style={{
              marginTop: 24,
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
              onPress={onConfirm}
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
                Reactivar liga
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const ReactivateLeagueModal = memo(ReactivateLeagueModalComponent);