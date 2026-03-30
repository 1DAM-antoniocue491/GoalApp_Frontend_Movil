import { Redirect, RelativePathString } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <Redirect href={('/auth/login') as RelativePathString} />
  )
}