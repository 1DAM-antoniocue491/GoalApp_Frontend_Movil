import React, { memo } from 'react';
import { Text, ViewStyle } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface SectionTitleProps {
  title: string;
  style?: ViewStyle;
}

function SectionTitleComponent({ title }: SectionTitleProps) {
  return (
    <Text
      style={{
        color: Colors.text.primary,
        fontSize: theme.fontSize.xl,
        lineHeight: 28,
        fontWeight: '700',
      }}
    >
      {title}
    </Text>
  );
}

export const SectionTitle = memo(SectionTitleComponent);