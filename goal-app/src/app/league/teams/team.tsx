import { styles } from "@/src/shared/styles";
import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Squad from "../../matches/all_programmed/squad";
import { Information } from "./information";
import { TeamTabs } from "@/src/shared/types/auth";
import { TeamsTabs } from "@/src/features/matches/components/TeamsTabs";

import { Ionicons } from '@expo/vector-icons';
import { Link, RelativePathString } from "expo-router";

interface TabContentProps {
    tab: TeamTabs;
}

function TabContent({ tab }: TabContentProps) {
    if (tab === 'information') return <Information />;
    if (tab === 'squad') return <Squad />;
    return null;
}

export default function Team() {
    const [activeTab, setActiveTab] = useState<TeamTabs>('information');
    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">
                 <Link href={'../../(tabs)/league' as RelativePathString} className="m-3">
                    <View className="bg-[#0F0F13] justify-center items-center rounded-4xl p-1 border border-[#262626]">
                        <Ionicons name="chevron-back-circle-outline" size={25} color="#FFFFFF"/>
                    </View>
                </Link>
                <View className="items-center">
                    <Image source={require('../../../../assets/images/betis.png')} className="w-30 h-30" resizeMode="contain" />
                    <Text className="text-white font-black text-2xl">Real Betis Balompié</Text>
                </View>
                <TeamsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabContent tab={activeTab} />
            </SafeAreaView>

        </View>
    );
}


