import { Text, View } from "react-native";
import { Screen } from "../../components/layout/Screen";
import { Button } from "../../components/ui/Button";
import React from "react";

export default function HomeScreen() {
    return (
        <Screen>
            <View className="flex-1 items-center justify-center gap-4">
                <Text className="text-2xl font-bold text-black">Home</Text>
                <Button title="Continuar" />
            </View>
        </Screen>
    );
}