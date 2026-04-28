/**
 * FinishedMatchStatisticsScreen
 * Estadísticas de un partido finalizado (tarjetas, eventos, etc.).
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export function FinishedMatchStatisticsScreen() {
    return (
        <SafeAreaView className="flex-1">
            <ScrollView>
                <View className="flex flex-row items-center mx-3">
                    <Text className="bg-[#2D2D2D] px-6 py-1 rounded-2xl text-center text-white">1</Text>
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(45, 45, 45, 1)', 'rgba(0,0,0,0)']}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 mx-2 rounded-xl px-4 py-2"
                    >
                        <Text className="text-white text-lg text-center">Tarjetas Amarillas</Text>
                    </LinearGradient>
                    <Text className="bg-[#2D2D2D] px-6 py-1 rounded-2xl text-center text-white">1</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
