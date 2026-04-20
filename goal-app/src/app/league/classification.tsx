import React, { useState } from "react";
import { View, Text } from "react-native";
import { styles } from "@/src/shared/styles";

export default function Classification() {
  

  return (
    <View className={styles.screenBase}>
      <View className=" pt-5">
        <Text className={`${styles.titleText} mb-6`}>
          Iniciar Sesión
        </Text>
      </View>
    </View>
  );
}