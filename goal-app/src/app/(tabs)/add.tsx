import { Text, View } from "react-native";
import { Screen } from "../../components/layout/Screen";
import { Button } from "../../components/ui/Button";
import React from "react";
import { styles } from "@/src/styles";

export default function HomeScreen() {
    return (
        <View className={styles.screenBase}>
            <Text className="text-2xl font-bold text-black">Home</Text>
        </View>
    );
}