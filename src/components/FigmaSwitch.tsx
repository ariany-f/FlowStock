import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';

interface FigmaSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  activeTrackColor?: string;
  inactiveTrackColor?: string;
  thumbColor?: string;
  size?: 'normal' | 'small';
  style?: ViewStyle;
}

export const FigmaSwitch: React.FC<FigmaSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  activeTrackColor = '#FFC107',
  inactiveTrackColor = '#3F576C',
  thumbColor = '#FFFFFF',
  size = 'normal',
  style,
}) => {
  const isSmall = size === 'small';
  const trackWidth = isSmall ? 42 : 50;
  const trackHeight = isSmall ? 24 : 30;
  const thumbSize = isSmall ? 18 : 24;
  const padding = 3;
  const maxTranslate = trackWidth - thumbSize - (padding * 2);

  const [anim] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [padding, padding + maxTranslate],
  });

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveTrackColor, activeTrackColor],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        style,
        { opacity: disabled ? 0.5 : 1 }
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: thumbColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
  },
  thumb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3,
  },
});
