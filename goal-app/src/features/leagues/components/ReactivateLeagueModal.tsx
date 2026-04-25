import React, { useRef, useCallback, useEffect, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Pressable,
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
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 80,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.65)',
          opacity: opacityAnim,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onCancel} />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: Colors.bg.surface1,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 40,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.bg.surface2,
              alignSelf: 'center',
              marginBottom: 28,
            }}
          />

          {/* Icon */}
          <View
            style={{
              height: 72,
              width: 72,
              borderRadius: 36,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 20,
              backgroundColor: `${Colors.brand.primary}18`,
              borderWidth: 1,
              borderColor: `${Colors.brand.primary}30`,
            }}
          >
            <Ionicons name="refresh" size={34} color={Colors.brand.primary} />
          </View>

          <Text
            style={{
              color: Colors.text.primary,
              fontSize: 22,
              fontWeight: '700',
              lineHeight: 28,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Reactivar Liga
          </Text>

          <Text
            style={{
              color: Colors.text.secondary,
              fontSize: 15,
              lineHeight: 22,
              textAlign: 'center',
              marginBottom: 32,
              paddingHorizontal: 8,
            }}
          >
            ¿Estás seguro que deseas reactivar{' '}
            <Text style={{ color: Colors.text.primary, fontWeight: '600' }}>
              {leagueName}
            </Text>
            ? Todos los miembros anteriores volverán a tener acceso inmediato.
          </Text>

          {/* Buttons */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onConfirm}
            style={{
              height: 58,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.brand.primary,
              marginBottom: 12,
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#0A0A0C" />
            <Text style={{ color: '#0A0A0C', fontSize: 16, fontWeight: '700' }}>
              Sí, reactivar liga
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancel}
            style={{
              height: 52,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: Colors.text.secondary, fontSize: 16, fontWeight: '500' }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export const ReactivateLeagueModal = memo(ReactivateLeagueModalComponent);