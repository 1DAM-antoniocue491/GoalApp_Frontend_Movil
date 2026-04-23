import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface JoinLeagueModalProps {
  visible: boolean;
  onConfirm: (inviteCode: string) => void;
  onCancel: () => void;
}

function JoinLeagueModalComponent({
  visible,
  onConfirm,
  onCancel,
}: JoinLeagueModalProps) {
  /**
   * Código que escribe el usuario para unirse a una liga.
   */
  const [inviteCode, setInviteCode] = useState('');

  /**
   * Cada vez que el modal se cierra, limpiamos el input.
   */
  useEffect(() => {
    if (!visible) {
      setInviteCode('');
    }
  }, [visible]);

  /**
   * Confirmación del join.
   * Solo enviamos el código si tiene contenido real.
   */
  const handleSubmit = useCallback(() => {
    const trimmed = inviteCode.trim();
    if (!trimmed) return;

    onConfirm(trimmed);
  }, [inviteCode, onConfirm]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Overlay */}
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
        {/* Contenedor del modal */}
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
          {/* Cabecera */}
          <View className="flex-row items-center justify-between mb-5">
            <Text
              style={{
                color: Colors.text.primary,
                fontSize: theme.fontSize.xxl,
                lineHeight: 30,
                fontWeight: '700',
              }}
            >
              Unirme a una liga
            </Text>

            <TouchableOpacity onPress={onCancel} activeOpacity={0.85}>
              <Ionicons
                name="close"
                size={22}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Campo del código */}
          <Text
            style={{
              color: Colors.text.secondary,
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            Código de invitación
          </Text>

          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="Ej. GOAL-2025-ABCD"
            placeholderTextColor={Colors.text.disabled}
            autoCapitalize="characters"
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
              backgroundColor: Colors.bg.base,
              paddingHorizontal: 16,
              height: 52,
              color: Colors.text.primary,
              fontSize: 15,
            }}
          />

          {/* Footer */}
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
              onPress={handleSubmit}
              activeOpacity={0.9}
              disabled={!inviteCode.trim()}
              style={{
                height: 48,
                paddingHorizontal: 18,
                borderRadius: 14,
                justifyContent: 'center',
                backgroundColor: inviteCode.trim()
                  ? Colors.brand.primary
                  : `${Colors.brand.primary}40`,
              }}
            >
              <Text
                style={{
                  color: Colors.bg.base,
                  fontSize: 15,
                  fontWeight: '700',
                  opacity: inviteCode.trim() ? 1 : 0.6,
                }}
              >
                Unirme
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const JoinLeagueModal = memo(JoinLeagueModalComponent);