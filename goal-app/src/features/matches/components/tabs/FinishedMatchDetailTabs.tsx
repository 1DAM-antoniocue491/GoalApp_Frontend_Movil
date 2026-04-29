/**
 * FinishedMatchDetailTabs.tsx
 *
 * Tabs internas del detalle de un partido finalizado (o en vivo):
 * Estadísticas / Alineación.
 * Usada por FinishedMatchDetailScreen.
 *
 * Renombrada desde MatchesLive para reflejar su propósito real.
 */

import { styles } from "@/src/shared/styles";
import { StatisticTabs } from "@/src/shared/types/auth";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";

interface FinishedMatchDetailTabsProps {
    activeTab: StatisticTabs;
    setActiveTab: (tab: StatisticTabs) => void;
}

export function FinishedMatchDetailTabs({ activeTab, setActiveTab }: FinishedMatchDetailTabsProps) {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 m-3 ">
            <View className="flex flex-col">
                <View className="flex flex-row justify-between">
                    <TouchableOpacity
                        onPress={() => setActiveTab('statistics')}
                        className={activeTab === 'statistics' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row gap-2 items-center justify-center p-2">
                            <Text className={activeTab === 'statistics' ? styles.tabActiveText : styles.tabInactiveText}>
                                Estadísticas
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('alignment')}
                        className={activeTab === 'alignment' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row justify-center p-2">
                            <Text className={activeTab === 'alignment' ? styles.tabActiveText : styles.tabInactiveText}>
                                Alineación
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
