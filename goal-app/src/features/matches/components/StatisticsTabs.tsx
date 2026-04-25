import { styles } from "@/src/shared/styles";
import { LeagueStatisticsTabs } from "@/src/shared/types/auth";
import { router } from "expo-router";
import React from "react";
import {
    View, TouchableOpacity, Text
} from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";



interface StatisticsTabsProps {
    activeTab: LeagueStatisticsTabs,
    setActiveTab: (tab: LeagueStatisticsTabs) => void;
}

export function StatisticsTabs({ activeTab, setActiveTab }: StatisticsTabsProps) {
    const router = useRouter();

    // navegamos entre rutas. Equipos y Jugadores.

    return (
        <SafeAreaView className="flex-1 m-3 ">
            <View className="flex flex-col">
                <View className="flex flex-row justify-between">
                    <TouchableOpacity
                        onPress={() => setActiveTab('match')}
                        className={activeTab === 'match' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row gap-2 items-center justify-center p-2">
                            <Text className={activeTab === 'match' ? styles.tabActiveText : styles.tabInactiveText}>
                                Equipos
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('players')}
                        className={activeTab === 'players' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row  justify-center p-2 ">
                            <Text className={activeTab === 'players' ? styles.tabActiveText : styles.tabInactiveText}>
                                Jugadores
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}