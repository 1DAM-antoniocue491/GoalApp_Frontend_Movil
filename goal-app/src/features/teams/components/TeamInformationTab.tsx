/**
 * TeamInformationTab
 * Tab de información general de un equipo: estadio, colores, entrenador y delegado.
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function TeamInformationTab() {
    return (
        <SafeAreaView className="flex-1 items-center justify-center ">
            <View className="flex mr-5 ml-5 mt-5 items-center justify-center">
                <View className="flex flex-row items-center mb-5 ">
                    <Image source={require('../../../../assets/images/liga.png')} className="w-18 h-18" resizeMode="contain" />
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(45, 45, 45, 1)', 'rgba(0,0,0,0)']}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 mx-2 rounded-xl px-4 py-2"
                    >
                        <Text className="text-white text-lg text-center">Liga BBVA</Text>
                    </LinearGradient>
                </View>
                <View className="flex flex-row items-center mb-5">
                    <MaterialIcons name="stadium" size={50} color="white" />
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(45, 45, 45, 1)', 'rgba(0,0,0,0)']}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 mx-2 rounded-xl px-4 py-2"
                    >
                        <Text className="text-white text-lg text-center">Benito Villamarín</Text>
                    </LinearGradient>
                </View>
                <View className="flex flex-row items-center mb-5">
                    <View className="flex-col gap-2">
                        <View className="w-15 h-5 bg-red-500" />
                        <View className="w-15 h-5 bg-blue-500" />
                    </View>
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(45, 45, 45, 1)', 'rgba(0,0,0,0)']}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 mx-2 rounded-xl px-4 py-2"
                    >
                        <Text className="text-white text-lg text-center">Colores</Text>
                    </LinearGradient>
                </View>
                <View className="flex flex-row items-center mb-5">
                    <Image source={require('../../../../assets/images/Entrenador.png')} className="w-18 h-18" resizeMode="contain" />
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(45, 45, 45, 1)', 'rgba(0,0,0,0)']}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 mx-2 rounded-xl px-4 py-2"
                    >
                        <Text className="text-white text-lg text-center">Manuel Pellegrini</Text>
                    </LinearGradient>
                </View>
                <View className="flex flex-row items-center ">
                    <Image source={require('../../../../assets/images/delegado.png')} className="w-18 h-18" resizeMode="contain" />
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(45, 45, 45, 1)', 'rgba(0,0,0,0)']}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 mx-2 rounded-xl px-4 py-2"
                    >
                        <Text className="text-white text-lg text-center">Curro Picchi</Text>
                    </LinearGradient>
                </View>
            </View>
        </SafeAreaView>
    );
}
