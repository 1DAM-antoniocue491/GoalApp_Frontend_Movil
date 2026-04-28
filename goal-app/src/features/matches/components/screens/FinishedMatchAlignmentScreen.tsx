/**
 * FinishedMatchAlignmentScreen
 * Alineaciones de un partido finalizado.
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { Text, View, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FinishedMatchAlignmentScreen() {
    return (
        <SafeAreaView className="flex-1 mt-5">
            <ScrollView>
                <View className="flex flex-row justify-between">
                    <View className="flex flex-col ml-8 ">
                        <Image source={require('../../../../../assets/images/betis.png')} className="w-15 h-15 mb-4" resizeMode="contain" />
                        <View className="flex flex-row gap-3">
                            <Text className="text-[#ADAEA9] text-center justify-center rounded-2xl">19</Text>
                            <Text className="text-[#ADAEA9] text-center justify-center rounded-2xl">Cucho Hernandez</Text>
                        </View>
                    </View>
                    <View className="flex flex-col justify-end">
                        <Image source={require('../../../../../assets/images/realMadrid.png')} className="w-15 h-15 mb-4" resizeMode="contain" />
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
