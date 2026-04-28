/**
 * TeamSquadTab
 * Tab de plantilla de un equipo, organizada por posición.
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { View, Text } from 'react-native';

export function TeamSquadTab() {
    return (
        <View className="mt-5">
            <View className="flex flex-row pl-5">
                <Text className="bg-[#C8F558] font-bold px-3 py-1 rounded">Porteros</Text>
                <View className="h-px bg-[#C8F558] w-full mt-8" />
            </View>
        </View>
    );
}
