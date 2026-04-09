import { Text, View, Image, ScrollView } from "react-native";
import React from "react";
import { styles } from "@/src/styles";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { StatisticTabs } from "@/src/types/auth";
import { LinearGradient } from 'expo-linear-gradient';


export default function Statistics() {
    return (
        <ScrollView>

            <View className="flex flex-row justify-between mr-3 ml-3 items-center ">
                <Text className="bg-[#2D2D2D] pr-8 pl-8 pt-1 pb-1 text-center justify-center rounded-2xl">1</Text>
                <LinearGradient
                    colors={[
                        'rgba(0,0,0,0)',       // borde izquierdo transparente
                        'rgba(0,0,0,0.8)',     // inicio del color oscuro
                        'rgba(0,0,0,0.8)',     // centro (donde está el texto)
                        'rgba(0,0,0,0)'        // borde derecho transparente
                    ]}
                    locations={[0, 0.9, 0, 0.9]} // controla dónde aparecen los colores
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="rounded-xl px-4 py-2 w-full"
                >
                    <Text className="text-white text-lg text-center">
                        Tarjetas Amarillas
                    </Text>
                </LinearGradient>

                <Text className="bg-[#2D2D2D] pr-8 pl-8 pt-1 pb-1 text-center justify-center rounded-2xl">1</Text>

            </View>

        </ScrollView>

    );
}