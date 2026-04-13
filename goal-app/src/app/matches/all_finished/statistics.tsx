import { Text, View, Image, ScrollView } from "react-native";
import React from "react";
import { styles } from "@/src/styles";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { StatisticTabs } from "@/src/types/auth";
import { LinearGradient } from 'expo-linear-gradient';


export default function Statistics() {
    return (
        <SafeAreaView className="flex-1">
            <ScrollView>
                <View className="flex flex-row items-center mx-3">
                    <Text className="bg-[#2D2D2D] px-6 py-1 rounded-2xl text-center text-white">1</Text>
                    <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(45, 45, 45, 1)', 'rgba(0,0,0,0)']} /*Define que empiece transparente, luego más oscuro y después más claro*/
                        locations={[0, 0.5, 1]} /*Define donde va aparecer el color */
                        start={{ x: 0, y: 0 }} /*Define que sea de izquierda a derecha*/
                        end={{ x: 1, y: 0 }} className="flex-1 mx-2 rounded-xl px-4 py-2">
                        <Text className="text-white text-lg text-center">Tarjetas Amarillas</Text>
                    </LinearGradient>
                    <Text className="bg-[#2D2D2D] px-6 py-1 rounded-2xl text-center text-white">1</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}