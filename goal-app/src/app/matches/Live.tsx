import { Text, View } from "react-native";
import { Screen } from "../../components/layout/Screen";
import { Button } from "../../components/ui/Button";
import React from "react";
import { styles } from "@/src/styles";

export default function Live() {
    return (
        <View className="flex flex-row pl-5">
            <Text className="bg-[#C8F558] font-bold px-3 py-1 rounded">Jornada 10</Text>
            <View className="h-px bg-[#C8F558] w-full mt-8" />
        </View>
    );
}