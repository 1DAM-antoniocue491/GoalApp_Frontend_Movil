import { styles } from "@/src/styles";
import { AuthTab, MatchesTab } from "@/src/types/auth";
import { router } from "expo-router";
import React from "react";
import {
    View, TouchableOpacity, Text
} from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";



interface MatchesTabsProps {
    activeTab: MatchesTab,
    setActiveTab: (tab: MatchesTab) => void;
}

export function MatchesTabs({ activeTab, setActiveTab }: MatchesTabsProps) {
    const router = useRouter();

    // navegamos entre rutas. Directo, Programados y Finalizados.

    return (
        <SafeAreaView className="flex-1 m-3 ">
            <View className="flex flex-col">
                <View className="flex flex-row justify-between">
                    <TouchableOpacity
                        onPress={() => setActiveTab('live')}
                        className={activeTab === 'live' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row gap-2 items-center justify-center p-2">
                            <View className="w-3 h-3 bg-red-500 rounded-full" />
                            <Text className={activeTab === 'live' ? styles.tabActiveText : styles.tabInactiveText}>
                                Directo
                            </Text>
                        </View>
                    </TouchableOpacity>


                    <TouchableOpacity
                        onPress={() => setActiveTab('programmed')}
                        className={activeTab === 'programmed' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex flex-row  justify-center p-2 ">
                            <Text className={activeTab === 'programmed' ? styles.tabActiveText : styles.tabInactiveText}>
                                Programados

                            </Text>

                        </View>

                    </TouchableOpacity>
                   
                    <TouchableOpacity
                        onPress={() => setActiveTab('finished')}
                        className={activeTab === 'finished' ? styles.tabPartido : styles.tabPartidoInactive}>
                        <View className="flex justify-center items-center p-2">
                            <Text className={activeTab === 'finished' ? styles.tabActiveText : styles.tabInactiveText}>
                                Finalizados
                            </Text>
                        </View>

                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}