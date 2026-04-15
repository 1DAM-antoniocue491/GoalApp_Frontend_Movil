/**
 * AppHeader - Cabecera superior compacta de la aplicación
 *
 * Se muestra en la parte superior de la pantalla principal
 * con el logo circular, nombre de la app y notificaciones.
 */
import React from 'react';
import { View, Image, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AppHeaderProps {
  onNotificationPress?: () => void;
}

export function AppHeader({ onNotificationPress }: AppHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 pt-15">
      {/* Logo + GoalApp */}
      <View className="flex-row items-center gap-3">
        {/* Logo circular de la app */}
        <View className="h-10 w-10 rounded-full bg-[#C4F135] items-center justify-center border-2 border-white">
          <Image
            source={require('../../../../assets/images/logo.png')}
            className="h-8 w-8 rounded-full"
            resizeMode="cover"
          />
        </View>
        {/* Texto GoalApp */}
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-white font-bold text-lg">GoalApp</Text>
          </View>
        </View>
      </View>

      {/* Icono de notificaciones */}
      <TouchableOpacity
        onPress={onNotificationPress}
        className="p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="notifications-outline" size={24} color="#8A9AA4" />
      </TouchableOpacity>
    </View>
  );
}
