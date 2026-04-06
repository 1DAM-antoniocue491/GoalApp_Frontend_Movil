import { Text, View, Image } from "react-native";
import { Screen } from "../../components/layout/Screen";
import { Button } from "../../components/ui/Button";
import React from "react";
import { styles } from "@/src/styles";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1 m-3 ">
                <View className="flex flex-row justify-between p-5">
                    <View className="flex flex-col">
                        <Text className="text-4xl font-bold text-white pl-4 pt-4">Hola Pepe</Text>
                        <Text className=" font-bold text-[#ADAEA9] p-4">Bienvenido a la aplicación.</Text>
                    </View>
                    <Image
                        source={require("../../../assets/images/logo.png")}
                        className="h-30 w-30"
                        resizeMode="cover"
                    />
                </View>
                <View className="flex flex-row pl-5">
                    <Text className="bg-[#C8F558] font-bold px-3 py-1 rounded">Partidos</Text>
                    <View className="h-px bg-[#C8F558] w-full mt-8" />
                </View>

                <View className="flex flex-row p-10">
                    <View className="w-3 h-3 bg-red-500 rounded-full" />
                    <Text className="text-white pl-4 text-xs">EN DIRECTO</Text>
                </View>

                <View className="flex flex-row justify-between">
                    <Text className="text-xs text-white pl-10">PRÓXIMOS PARTIDOS</Text>
                    <Text className="text-xs text-[#C8F558] pr-5">VER TODO</Text>
                </View>

                <Text className="text-xs text-white pl-10">RESUMEN LIGA</Text>

                <View className="flex justify-center">
                    <View className="flex flex-row pt-5 pr-15 pl-5 justify-between">
                        <View className="flex flex-col bg-[#4b494b] rounded-2xl pt-8 pb-8 pr-13 pl-13 border border-[#8d8d8d] border-l-[#C8F558] border-l-4">
                            <Text className="text-white text-center">3</Text>
                            <Text className="text-[#ADAEA9] text-xs text-center">EQUIPOS</Text>
                        </View>
                         <View className="flex flex-col bg-[#4b494b] rounded-2xl pt-8 pb-8 pr-13 pl-13 border border-[#8d8d8d] border-l-[#00B4D8] border-l-4">
                            <Text className="text-white text-center">64</Text>
                            <Text className="text-[#ADAEA9] text-xs  text-center">JUGADORES</Text>
                        </View>
                    </View>
                    <View className="flex flex-row pt-5 pr-5 pl-5 justify-between">
                        <View className="flex flex-col bg-[#4b494b] rounded-2xl pt-8 pb-8 pr-13 pl-13 border border-[#8d8d8d] border-l-[#FF453A] border-l-4">
                            <Text className="text-white text-center">3</Text>
                            <Text className="text-[#ADAEA9] text-xs text-center">PARTIDOS</Text>
                        </View>
                         <View className="flex flex-col bg-[#4b494b] rounded-2xl pt-8 pb-8 pr-10 pl-10 border border-[#8d8d8d] border-l-[#32D74B] border-l-4">
                            <Text className="text-white text-center">3</Text>
                            <Text className="text-[#ADAEA9] text-xs text-center">DELEGADO DE CAMPO</Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}