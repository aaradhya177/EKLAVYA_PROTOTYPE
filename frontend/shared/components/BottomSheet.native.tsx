import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Modal, PanResponder, Pressable, Text, View } from "react-native";

import { colors, radius, spacing } from "../tokens";
import type { BottomSheetProps } from "./types";

export function BottomSheet({ visible, title, children, onClose, snapPoints = [0.35, 0.65, 0.9] }: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(600)).current;
  const sortedSnapPoints = useMemo(() => [...snapPoints].sort(), [snapPoints]);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true
    }).start();
  }, [translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldClose = gesture.dy > 120;
          Animated.spring(translateY, {
            toValue: shouldClose ? 600 : 0,
            useNativeDriver: true
          }).start(() => {
            if (shouldClose) {
              onClose();
            }
          });
        }
      }),
    [onClose, translateY]
  );

  const maxHeight = `${Math.round(sortedSnapPoints[sortedSnapPoints.length - 1] * 100)}%`;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} onPress={onClose}>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            marginTop: "auto",
            maxHeight,
            transform: [{ translateY }],
            backgroundColor: colors.white,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing[5]
          }}
        >
          <View style={{ alignItems: "center", marginBottom: spacing[4] }}>
            <View style={{ width: 48, height: 5, borderRadius: radius.full, backgroundColor: colors.gray[200] }} />
          </View>
          {title ? <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: spacing[4] }}>{title}</Text> : null}
          {children}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
