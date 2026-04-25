import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { styles } from "@/src/shared/styles";
import { Link, RelativePathString } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
export default function Match() {
    return (
        <View className="mr-3 ml-3 gap-3">
            <View className="flex-row items-center gap-3">
                <Image source={require('../../../assets/images/betis.png')} className="w-15 h-15" resizeMode="contain" />
                <Text className="text-white text-3xl font-black">Real Betis Balompié</Text>
            </View>

            <View className="flex-col items-center border border-[#C8F558] rounded-2xl m-3 p-5 bg-[#161616] shadow-sm shadow-[#C8F558]">
                <View className="flex-row justify-between w-full p-10">
                    <View className="gap-3 items-center">
                        <Text className="text-white text-6xl font-black">30</Text>
                        <Text className="text-[#CCCCCC] text-xl">Goles</Text>
                    </View>
                     <Image source={require('../../../assets/images/betis.png')} className="w-30 h-30" resizeMode="contain" />
                </View>
                <View className="flex-row gap-3">

                    <View className="flex-1 h-24 bg-[#0F0F13] justify-center items-center rounded-2xl">
                        <Text className="text-[#CCCCCC]">Victorias</Text>
                        <Text className="text-white text-lg font-black">10</Text>
                    </View>

                    <View className="flex-1 h-24 bg-[#0F0F13] justify-center items-center rounded-2xl">
                        <Text className="text-[#CCCCCC]">Derrotas</Text>
                        <Text className="text-white text-lg font-black">10</Text>
                    </View>

                    <View className="flex-1 h-24 bg-[#0F0F13] justify-center items-center rounded-2xl">
                        <Text className="text-[#CCCCCC]">Empates</Text>
                        <Text className="text-white text-lg font-black">10</Text>
                    </View>
                </View>
            </View>
            <View className="flex-row justify-between mr-6">
                <Text className="text-[##CCCCCC]"> GOLEADORES DE LA LIGA</Text>
                <Text className="text-[##CCCCCC]">GOLES</Text>
            </View>
            <View className="flex-row border items-center justify-between  border-[#C8F558] rounded-2xl m-3 p-5 bg-[#161616] shadow-sm shadow-[#C8F558]">
                <View className="flex-row gap-3 items-center ">
                    <Text className="text-white">2</Text>
                    <Image source={require('../../../assets/images/realMadrid.png')} className="w-8 h-8" resizeMode="contain" />
                    <Text className="text-white font-black">Real Madrid</Text>
                </View>

                <View className="flex-row gap-3 items-center">
                    <Ionicons name="football" size={25} color="#FFFFFF" />
                    <Text className="text-white text-lg font-black">20</Text>
                </View>
            </View>
        </View>
    );
}