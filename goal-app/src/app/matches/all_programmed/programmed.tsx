import { Text, View, Image } from "react-native";
import React, { useState } from "react";
import { styles } from "@/src/shared/styles";
import { MatchesTabs } from "@/src/features/matches/components/MatchesTabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, RelativePathString } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { ProgrammedTabs } from "@/src/shared/types/auth";
import PreviousMeetings from "../all_programmed/previousMeetings";
import Squad from "./squad";
import { MatchesProgrammed } from "@/src/features/matches/components/MatchesProgrammed";
interface TabContentProps {
    tab: ProgrammedTabs;
}

function TabContent({ tab }: TabContentProps) {
    if (tab === 'previousMeeting') return <PreviousMeetings/>;
    if (tab === 'squad') return <Squad />;
    return null;
}


export default function Programmed() {
    const [activeTab, setActiveTab] = useState<ProgrammedTabs>('previousMeeting');
    return (
         <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">
                <View className="p-7 justify-center ">
                    <View className="flex flex-row justify-between">
                        <View className="flex flex-row items-center gap-2">
                            <Link href={'../../(tabs)/matches' as RelativePathString}>
                                <Ionicons name="chevron-back-circle-outline" size={25} color="#FFFFFF" className="bg-[#0F0F13] justify-center items-center rounded-4xl p-1 border border-[#262626]" />
                            </Link>
                            <Text className="text-3xl font-bold text-white">Partido</Text>
                        </View>
                        <Ionicons name="ellipsis-vertical-outline" size={35} color="#FFFFFF" />
                    </View>
                    <Text className="text-[#ADAEA9] ml-8 pb-10">Partido programado</Text>
                    <View className="flex flex-col justify-between items-center border border-[#C8F558] rounded-2xl m-3 bg-[#161616] shadow-sm shadow-[#C8F558] p-8">
                        <View className="flex flex-row">
                            <View className="flex flex-col items-center justify-center">
                                <Image source={require('../../../../assets/images/betis.png')} className="w-30 h-30" resizeMode="contain" />
                                <Text className="text-white font-black text-2xl">Real Betis</Text>
                            </View>
                            <View className="flex flex-col items-center justify-center ">
                                <Text className="text-white text-3xl font-black">21:00</Text>
                                <Text className="text-white">13 de Marzo</Text>
                            </View>
                            <View className="flex flex-col items-center justify-center">
                                <Image source={require('../../../../assets/images/realMadrid.png')} className="w-30 h-30" resizeMode="contain" />
                                <Text className="text-white font-black text-2xl">Real Madrid</Text>
                            </View>
                        </View>
                        <View className="flex flex-row justify-center items-center gap-2 mt-4">
                            <Ionicons name="location-outline" size={18} color="#C8F558" className="items-center" />
                            <Text className="text-[#C8F558]">Estadio La Cartuja</Text>
                        </View>
                    </View>
                </View>
                <MatchesProgrammed activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabContent tab={activeTab} />
            </SafeAreaView>
        </View>
    );
}