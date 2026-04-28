import React from 'react';
import { View } from 'react-native-reanimated/lib/typescript/Animated';

function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <View>
            {children}
        </View>
    );
}

export default QueryProvider;