/**
 * EmptyLeaguesState - Estado vacío cuando el usuario no tiene ligas
 *
 * Se muestra cuando no hay ligas disponibles, ocultando
 * el buscador, filtros y listado.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function EmptyLeaguesState() {
  return (
    <View className="items-center justify-center py-12 px-6">
      {/* Icono decorativo relacionado con fútbol/liga */}
      <View className="h-24 w-24 rounded-full bg-[#1D1C22] items-center justify-center mb-6 border border-[#2A2A35]">
        <Ionicons name="trophy-outline" size={48} color="#525258" />
      </View>

      {/* Título */}
      <Text className="text-white font-semibold text-xl text-center mb-2">
        Aún no tienes ligas
      </Text>

      {/* Texto secundario */}
      <Text className="text-[#8A9AA4] text-sm text-center leading-5">
        Crea una nueva liga o únete con un código de invitación para empezar
      </Text>
    </View>
  );
}
