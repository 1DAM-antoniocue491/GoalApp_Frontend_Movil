import { Text, View, Image, ScrollView } from "react-native";
import React from "react";
import { styles } from "@/src/shared/styles";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { StatisticTabs } from "@/src/shared/types/auth";
import { LinearGradient } from 'expo-linear-gradient';


export default function HomeScreen() {
    return (
        <SafeAreaView className="flex-1">
            <ScrollView>
                <View className="flex flex-row justify-between">
                    <View className="flex flex-col ml-8 ">
                        <Image source={require('../../../../assets/images/betis.png')} className="w-15 h-15 mb-4" resizeMode="contain" />
                        <View className="flex flex-row gap-3">
                            <Text className="text-[#ADAEA9] text-center justify-center rounded-2xl">19</Text>
                            <Text className="text-[#ADAEA9] text-center justify-center rounded-2xl">Cucho Hernandez</Text>
                        </View>
                    </View>
                    <View className="flex flex-col justify-end">
                        <Image source={require('../../../../assets/images/realMadrid.png')} className="w-15 h-15 mb-4" resizeMode="contain" />
                        <View className="flex flex-row gap-3">
                            <Text className="text-[#ADAEA9] text-center justify-center rounded-2xl">19</Text>
                            <Text className="text-[#ADAEA9] text-center justify-center rounded-2xl mr-8">Cucho Hernandez</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}