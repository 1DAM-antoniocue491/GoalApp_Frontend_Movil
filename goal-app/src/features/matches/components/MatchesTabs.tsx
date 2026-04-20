import { styles } from "@/src/shared/styles";
import { AuthTab, MatchesTab } from "@/src/shared/types/auth";
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
                        <View className="flex flex-row  justify-center p-2 ">
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