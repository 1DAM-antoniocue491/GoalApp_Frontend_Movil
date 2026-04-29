/**
 * TeamsTabs.tsx
 *
 * Tabs de navegación en el detalle de un equipo:
 * Información / Plantilla.
 *
 * Movida desde features/matches/components a su feature correcta.
 */

import { styles } from "@/src/shared/styles";
import { TeamTabs } from "@/src/shared/types/auth";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TeamTabsProps {
    activeTab: TeamTabs;
    setActiveTab: (tab: TeamTabs) => void;
}

export function TeamsTabs({ activeTab, setActiveTab }: TeamTabsProps) {
    return (
        <SafeAreaView className="flex-1 m-3 ">
            <View className="flex flex-col">
                <View className="flex flex-row justify-between">
                    <TouchableOpacity
                        onPress={() => setActiveTab('information')}
                        className={activeTab === 'information' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex justify-center items-center p-2">
                            <Text className={activeTab === 'information' ? styles.tabActiveText : styles.tabInactiveText}>
                                Información
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('squad')}
                        className={activeTab === 'squad' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex justify-center items-center p-2">
                            <Text className={activeTab === 'squad' ? styles.tabActiveText : styles.tabInactiveText}>
                                Plantilla
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
