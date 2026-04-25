import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { styles } from "@/src/shared/styles";
import { Link, RelativePathString } from "expo-router";

export default function Classification() {
  return (
    <View className="m-3">
      <View className="flex-row bg-[#C8F558] items-center">
        <Text className="w-42 text-center text-black text-xs font-black p-2">Equipo</Text>
        <Text className="w-10 text-center text-xs font-black">Pts</Text>
        <Text className="w-10 text-center text-xs font-black">PJ</Text>
        <Text className="w-10 text-center text-xs font-black">V</Text>
        <Text className="w-10 text-center text-xs font-black">E</Text>
        <Text className="w-10 text-center text-xs font-black">D</Text>
        <Text className="w-10 text-center text-xs font-black">GF</Text>
        <Text className="w-10 text-center text-xs font-black">GC</Text>
      </View>

      <Link href={'../league/teams/team' as RelativePathString}>
        <View className="flex-row bg-[#0F0F13] items-center p-2">

          <View className="w-40 flex-row items-center gap-1">
            <Image
              source={require('../../../assets/images/betis.png')}
              className="w-8 h-8"
              resizeMode="contain"
            />
            <Text className="text-white text-xs">
              Real Betis Balompié
            </Text>
          </View>

          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>

        </View>
      </Link>

       <Link href={'../league/teams/team' as RelativePathString}>
        <View className="flex-row bg-[#1C1C22] items-center p-2">
          <View className="w-40 flex-row items-center gap-1">
            <Image source={require('../../../assets/images/betis.png')} className="w-8 h-8" resizeMode="contain" />
            <Text className="text-white text-xs">Real Madrid</Text>
          </View>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
          <Text className="w-10 text-white text-center text-xs">0</Text>
        </View>
      </Link>
    </View>
  );
}