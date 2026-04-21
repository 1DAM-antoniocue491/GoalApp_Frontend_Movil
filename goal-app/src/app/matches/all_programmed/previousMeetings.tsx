import { ScrollView, Text, View, Image } from "react-native";
import React from "react";
import { styles } from "@/src/shared/styles";
import { MatchesTabs } from "@/src/features/matches/components/MatchesTabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, RelativePathString } from "expo-router";

export default function previousMeeting() {
    return (
        <SafeAreaView className="flex-1">
            <ScrollView className="mr-3 ml-3">
                <View className="border border-[#C8F558] rounded-2xl p-5 bg-[#161616] shadow-sm shadow-[#C8F558] justify-between mb-4">
                    <View className="flex flex-row justify-between items-center w-full">
                        <View className="flex flex-col items-center">
                            <Image source={require('../../../../assets/images/betis.png')} className="w-15 h-15" resizeMode="contain" />
                            <Text className="text-white font-black">Real Betis</Text>
                            <Text className="text-[#ADAEA9] text-xs">Cucho Hernández 61' 70'</Text>
                        </View>
                        <View className="flex flex-col items-center">
                            <View className="flex flex-row gap-3">
                                <Text className="text-white text-4xl font-black">2</Text>
                                <Text className="text-white text-4xl font-black">-</Text>
                                <Text className="text-white text-4xl font-black">1</Text>
                            </View>
                        </View>
                        <View className="flex flex-col items-center">
                            <Image source={require('../../../../assets/images/realMadrid.png')} className="w-15 h-15" resizeMode="contain" />
                            <Text className="text-white font-black">Real Madrid</Text>
                            <Text className="text-[#ADAEA9] text-xs">Kyliam Mbappé 10'</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}