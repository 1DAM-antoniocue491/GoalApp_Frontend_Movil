import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { styles } from "@/src/shared/styles";
import { Link, RelativePathString } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
export default function Teams() {
  return (
    <View>
      <View className="flex items-center justify-center flex-row border border-[#C8F558] rounded-2xl m-3 p-5 bg-[#161616] shadow-sm shadow-[#C8F558] ">
        <Link href={'../league/teams/team' as RelativePathString}>
        <View className="items-center justify-center">
          <View className="flex flex-row items-center justify-center gap-4">
            <Image source={require('../../../assets/images/betis.png')} className="w-20 h-20" resizeMode="contain" />
            <Text className="text-white font-black text-2xl">Real Betis Balompié</Text>
          </View>
          <View className="flex flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#C8F558" />
            <Text className="text-[#C8F558]">Estadio la Cartuja</Text>
          </View>
        </View>
        </Link>
      </View>
    </View>
  );
}