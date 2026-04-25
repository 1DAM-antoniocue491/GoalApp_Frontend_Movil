import { styles } from "@/src/shared/styles";
import { AuthTab, LeagueTab, MatchesTab, TeamTabs } from "@/src/shared/types/auth";
import { router } from "expo-router";
import React from "react";
import { View, Text, Image, ScrollView } from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";

export function Information() {
    return (
        <SafeAreaView className="flex-1">
            <ScrollView>
                <View>
                    <Text className="text-white">Liga BBVA</Text>
                    <Text className="text-white">Benito Villamarín</Text>
                    <Text className="text-white">Colores</Text>
                    <Text className="text-white">Manuel Pellegrini</Text>
                    <Text className="text-white">Curro Picchi</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}