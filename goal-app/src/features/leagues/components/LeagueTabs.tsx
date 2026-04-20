import { styles } from "@/src/shared/styles";
import { AuthTab, LeagueTab, MatchesTab } from "@/src/shared/types/auth";
import { router } from "expo-router";
import React from "react";
import {
    View, TouchableOpacity, Text
} from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";



interface LeagueTabsProps {
    activeTab: LeagueTab,
    setActiveTab: (tab: LeagueTab) => void;
}

export function LeagueTabs({ activeTab, setActiveTab }: LeagueTabsProps) {
    const router = useRouter();

    // navegamos entre rutas. Directo, Programados y Finalizados.

    return (
        <SafeAreaView className="flex-1 m-3 ">
            <View className="flex flex-col">
                <View className="flex flex-row justify-between">
                    <TouchableOpacity
                        onPress={() => setActiveTab('match')}
                        className={activeTab === 'match' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row gap-2 items-center justify-center p-2">
                            <Text className={activeTab === 'match' ? styles.tabActiveText : styles.tabInactiveText}>
                                Jornada
                            </Text>
                        </View>
                    </TouchableOpacity>


                    <TouchableOpacity
                        onPress={() => setActiveTab('teams')}
                        className={activeTab === 'teams' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row  justify-center p-2 ">
                            <Text className={activeTab === 'teams' ? styles.tabActiveText : styles.tabInactiveText}>
                                Equipos
                            </Text>

                        </View>

                    </TouchableOpacity>
                   
                    <TouchableOpacity
                        onPress={() => setActiveTab('classification')}
                        className={activeTab === 'classification' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex justify-center items-center p-2">
                            <Text className={activeTab === 'classification' ? styles.tabActiveText : styles.tabInactiveText}>
                                Clasificación
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}