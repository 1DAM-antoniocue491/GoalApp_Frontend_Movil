import { Text, View, Image } from "react-native";
import { Screen } from "../../components/layout/Screen";
import { Button } from "../../components/ui/Button";
import React from "react";
import { styles } from "@/src/styles";
import { Ionicons } from '@expo/vector-icons';
import { Link, RelativePathString } from "expo-router";

export default function Programmed() {
    return (
        <View>
            <View className="flex flex-row pl-5">
                <Text className="bg-[#C8F558] font-bold px-3 py-1 rounded">Jornada 10</Text>
                <View className="h-px bg-[#C8F558] w-full mt-8" />
            </View>
            <View className="flex flex-col border border-[#C8F558] rounded-2xl m-3 p-5 bg-[#161616] shadow-sm shadow-[#C8F558]">
                <Link href={'../matches/all_programmed/programmed' as RelativePathString} >
                    <View className="w-full">
                        <View className="flex flex-row justify-between">
                            <View className="flex flex-col items-center">
                                <Image source={require('../../../assets/images/betis.png')} className="w-15 h-15" resizeMode="contain" />
                                <Text className="text-white font-black">Real Betis</Text>
                            </View>

                            <View className="flex flex-col items-center">
                                <Text className="text-white text-xl font-black">21:00</Text>
                                <Text className="text-white text-md">13 de Marzo</Text>
                            </View>

                            <View className="flex flex-col items-center">
                                <Image
                                    source={require('../../../assets/images/realMadrid.png')}
                                    className="w-15 h-15"
                                    resizeMode="contain"
                                />
                                <Text className="text-white font-black">Real Madrid</Text>
                            </View>
                        </View>

                        <View className="flex flex-row justify-center items-center gap-2 mt-4">
                            <Ionicons name="location-outline" size={18} color="#C8F558" />
                            <Text className="text-[#C8F558]">Estadio La Cartuja</Text>
                        </View>
                    </View>
                </Link>
            </View>
        </View>
    );
}