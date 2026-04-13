import { styles } from "@/src/styles";
import { AuthTab, MatchesTab, ProgrammedTabs, StatisticTabs } from "@/src/types/auth";
import { router } from "expo-router";
import React from "react";
import {
    View, TouchableOpacity, Text
} from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";



interface MatchesProgrammedTabsProps {
    activeTab: ProgrammedTabs,
    setActiveTab: (tab: ProgrammedTabs) => void;
}

export function MatchesProgrammed({ activeTab, setActiveTab }: MatchesProgrammedTabsProps) {
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
                        <View className="flex flex-row  justify-center p-2 ">
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