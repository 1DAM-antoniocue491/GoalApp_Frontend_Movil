import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import React from "react";

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 py-3">{children}</View>
    </SafeAreaView>
  );
}