import { styles } from "@/src/shared/styles";
import { AuthTab, LeagueTab, MatchesTab, TeamTabs } from "@/src/shared/types/auth";
import { router } from "expo-router";
import React from "react";
import {View, TouchableOpacity, Text, Image} from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export function Squad() {

    return (
        <View className="mt-5">
            <View className="flex flex-row pl-5">
                <Text className="bg-[#C8F558] font-bold px-3 py-1 rounded">Porteros</Text>
                <View className="h-px bg-[#C8F558] w-full mt-8" />
            </View>
                
        </View>
    );
}