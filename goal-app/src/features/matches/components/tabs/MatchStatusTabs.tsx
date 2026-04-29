/**
 * MatchStatusTabs.tsx
 *
 * Tabs de navegación entre estados de partido: Directo / Programados / Finalizados.
 * Usada por MatchesHubScreen para cambiar la vista activa del hub.
 *
 * Renombrada desde MatchesTabs para reflejar su propósito real.
 */

import { styles } from "@/src/shared/styles";
import { MatchesTab } from "@/src/shared/types/auth";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";

interface MatchStatusTabsProps {
    activeTab: MatchesTab;
    setActiveTab: (tab: MatchesTab) => void;
}

export function MatchStatusTabs({ activeTab, setActiveTab }: MatchStatusTabsProps) {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 ">
            <View className="flex flex-col">
                <View className="flex flex-row justify-between gap-2 mr-3 ml-3">
                    <TouchableOpacity
                        onPress={() => setActiveTab('live')}
                        className={activeTab === 'live' ? styles.tabStateMatch : styles.tabStateMatchInactive}>
                        <View className="flex flex-row gap-2 items-center justify-center p-2">
                            <View className="w-3 h-3 bg-red-500 rounded-full" />
                            <Text className={activeTab === 'live' ? styles.tabActiveMatchText : styles.tabInactiveMacthText}>
                                Directo
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('programmed')}
                        className={activeTab === 'programmed' ? styles.tabStateMatch : styles.tabStateMatchInactive}>
                        <View className="flex flex-row justify-center p-2">
                            <Text className={activeTab === 'programmed' ? styles.tabActiveMatchText : styles.tabInactiveMacthText}>
                                Programados
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('finished')}
                        className={activeTab === 'finished' ? styles.tabStateMatch : styles.tabStateMatchInactive}>
                        <View className="flex justify-center items-center p-2">
                            <Text className={activeTab === 'finished' ? styles.tabActiveMatchText : styles.tabInactiveMacthText}>
                                Finalizados
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
