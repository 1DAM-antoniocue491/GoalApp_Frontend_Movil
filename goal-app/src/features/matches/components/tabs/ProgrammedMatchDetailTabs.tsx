/**
 * ProgrammedMatchDetailTabs.tsx
 *
 * Tabs internas del detalle de un partido programado:
 * Encuentros anteriores / Convocatoria.
 * Usada por ProgrammedMatchDetailScreen.
 *
 * Renombrada desde MatchesProgrammed para reflejar su propósito real.
 */

import { styles } from "@/src/shared/styles";
import { ProgrammedTabs } from "@/src/shared/types/auth";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";

interface ProgrammedMatchDetailTabsProps {
    activeTab: ProgrammedTabs;
    setActiveTab: (tab: ProgrammedTabs) => void;
}

export function ProgrammedMatchDetailTabs({ activeTab, setActiveTab }: ProgrammedMatchDetailTabsProps) {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 m-3 ">
            <View className="flex flex-col">
                <View className="flex flex-row justify-between">
                    <TouchableOpacity
                        onPress={() => setActiveTab('previousMeeting')}
                        className={activeTab === 'previousMeeting' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row gap-2 items-center justify-center p-2">
                            <Text className={activeTab === 'previousMeeting' ? styles.tabActiveText : styles.tabInactiveText}>
                                Encuentros anteriores
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('squad')}
                        className={activeTab === 'squad' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row justify-center p-2">
                            <Text className={activeTab === 'squad' ? styles.tabActiveText : styles.tabInactiveText}>
                                Convocatoria
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
