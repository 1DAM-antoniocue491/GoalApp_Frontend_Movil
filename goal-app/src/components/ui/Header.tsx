/**
 * Header - Cabecera interactiva de la aplicación
 *
 * Componente de cabecera que incluye:
 * - Logo interactivo (redirige al onboarding al presionar)
 * - Botón de notificaciones (sin funcionalidad por ahora)
 *
 * @example
 * <Header
 *   onLogoPress={() => router.push('/onboarding')}
 *   onNotificationPress={() => console.log('Notificaciones presionadas')}
 * />
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  /** Callback al presionar el logo (default: navega a onboarding) */
  onLogoPress?: () => void;
  /** Callback al presionar notificaciones */
  onNotificationPress?: () => void;
}

interface AppHeaderProps {
  onNotificationPress?: () => void;
}

export function Header({
  onLogoPress,
  onNotificationPress,
}: HeaderProps) {
  const router = useRouter();

  const handleLogoPress = () => {
    if (onLogoPress) {
      onLogoPress();
    } else {
      // Navegación por defecto al onboarding
      router.push('/onboarding' as any);
    }
  };

  return (
    <View className="flex-row items-center justify-between px-6 pt-12 pb-4 bg-[#0F0F13]">
      {/* Logo interactivo */}
      <TouchableOpacity
        onPress={handleLogoPress}
        activeOpacity={0.8}
        className="flex-row items-center gap-3"
      >
        <Image
          source={require('../../../assets/images/logo.png')}
          className="w-10 h-10 rounded-lg"
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-xl">GoalApp</Text>
      </TouchableOpacity>

      {/* Icono de notificaciones */}
      <TouchableOpacity
        onPress={onNotificationPress}
        activeOpacity={0.8}
        className="w-10 h-10 rounded-full bg-[#2A2A35] items-center justify-center"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="notifications-outline" size={20} color="#8A9AA4" />
      </TouchableOpacity>
    </View>
  );
}
