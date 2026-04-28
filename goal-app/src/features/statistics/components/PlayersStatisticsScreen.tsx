/**
 * PlayersStatisticsScreen
 *
 * Pantalla de estadísticas de un jugador.
 * Muestra: nombre, equipo, posición, goles, tarjetas, MVPs y tabla de goleadores.
 * TODO: recibir datos reales por props o hook cuando la API esté disponible.
 */

import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PlayersStatisticsScreen() {
  return (
    <View className="mr-3 ml-3 mt-5 gap-3">
      <Text className="text-white text-3xl font-black">Cucho Hernández</Text>

      <View className="flex-row items-center gap-3">
        <Image
          source={require('../../../../assets/images/betis.png')}
          className="w-8 h-8"
          resizeMode="contain"
        />
        <Text className="text-[#CCCCCC]">Real Betis Balompié</Text>
        <View className="w-3 h-3 bg-[#CCCCCC] rounded-full" />
        <Text className="text-[#CCCCCC]">Delantero</Text>
      </View>

      <View className="flex-col items-center border border-[#C8F558] rounded-2xl m-3 p-5 bg-[#161616] shadow-sm shadow-[#C8F558]">
        <View className="flex-row justify-between w-full p-10">
          <View className="gap-3 items-center">
            <Text className="text-white text-6xl font-black">30</Text>
            <Text className="text-[#CCCCCC] text-xl">Goles</Text>
          </View>
          <Ionicons
            name="person-outline"
            size={70}
            color="#FFFFFF"
            // style: className de NativeWind no aplica directamente a Ionicons;
            // el fondo/borde se gestiona con un View envolvente si fuera necesario
          />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1 h-24 bg-[#0F0F13] justify-center items-center rounded-2xl">
            <Text className="text-[#CCCCCC]">Amarillas</Text>
            <Text className="text-white text-lg font-black">10</Text>
          </View>
          <View className="flex-1 h-24 bg-[#0F0F13] justify-center items-center rounded-2xl">
            <Text className="text-[#CCCCCC]">Rojas</Text>
            <Text className="text-white text-lg font-black">10</Text>
          </View>
          <View className="flex-1 h-24 bg-[#0F0F13] justify-center items-center rounded-2xl">
            <Text className="text-[#CCCCCC]">MVP</Text>
            <Text className="text-white text-lg font-black">10</Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between mr-6">
        <Text className="text-[#CCCCCC]">GOLEADORES DE LA LIGA</Text>
        <Text className="text-[#CCCCCC]">GOLES</Text>
      </View>

      <View className="flex-row border items-center justify-between border-[#C8F558] rounded-2xl m-3 p-5 bg-[#161616] shadow-sm shadow-[#C8F558]">
        <View className="flex-row gap-3 items-center">
          <Text className="text-white">2</Text>
          <Image
            source={require('../../../../assets/images/betis.png')}
            className="w-8 h-8"
            resizeMode="contain"
          />
          <View className="flex-col">
            <Text className="text-white">Marc Roca</Text>
            <Text className="text-xs text-[#CCCCCC]">Real Betis Balompié</Text>
          </View>
        </View>
        <View className="flex-row gap-3 items-center">
          <Ionicons name="football" size={25} color="#FFFFFF" />
          <Text className="text-white text-lg font-black">20</Text>
        </View>
      </View>
    </View>
  );
}
