import { Text, View, Image } from "react-native";
import { ScreenLayout } from "@/src/shared/components/layout/Screen";
import { Button } from "@/src/shared/components/ui/Button";
import React from "react";
import { styles } from "@/src/shared/styles";
import { Link, RelativePathString } from "expo-router";

export default function Finished() {
    return (
        <View className="mt-5">
            <View className="flex flex-row pl-5">
                <Text className="bg-[#C8F558] font-bold px-3 py-1 rounded">Jornada 10</Text>
                <View className="h-px bg-[#C8F558] w-full mt-8" />
            </View>
            <View className="border border-[#C8F558] rounded-2xl m-3 p-5 bg-[#161616] shadow-sm shadow-[#C8F558] justify-between">
                <Link href={'../matches/all_finished/live' as RelativePathString}>
                    <View className="flex flex-row justify-between items-center w-full">
                        <View className="flex flex-col items-center">
                            <Image source={require('../../../assets/images/betis.png')} className="w-15 h-15" resizeMode="contain" />
                            <Text className="text-white font-black">Real Betis</Text>
                        </View>
                        <View className="flex flex-col items-center">
                            <View className="flex flex-row gap-3">
                                <Text className="text-white text-4xl font-black">2</Text>
                                <Text className="text-white text-4xl font-black">-</Text>
                                <Text className="text-white text-4xl font-black">1</Text>
                            </View>
                        </View>
                        <View className="flex flex-col items-center">
                            <Image source={require('../../../assets/images/realMadrid.png')} className="w-15 h-15" resizeMode="contain" />
                            <Text className="text-white font-black">Real Madrid</Text>
                           
                        </View>
                    </View>
                </Link>
            </View>
        </View>
    );
}