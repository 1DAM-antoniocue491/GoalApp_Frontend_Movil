import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css"; //IMPORTANTE AÑADIR EL .. al principio
import React from "react";

export default function RootLayout() {

    // Ocultar cabecera 
    return (
        <SafeAreaProvider>
            <Stack screenOptions={{
                headerShown: false,
            }} >

            </Stack>
        </SafeAreaProvider>)
}
