import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { MyText } from "../MyText";

interface RadioBtn {
  id: string;
  label: string;
}
export default function RadioBtnGroup({
  option,
  onSelect,
  selected
}: {
  option: RadioBtn;
  onSelect: (value: string) => void;
  selected: boolean
}) {

  const handlePress = (value: any) => {
    onSelect(value);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.container}
        onPress={() => handlePress(option.id)}
      >
        <View style={styles.outerCircle}>
          {selected && <View style={styles.innerCircle} />}
        </View>
        <MyText style={styles.text}>{option.label}</MyText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  outerCircle: {
    height: 18,
    width: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fcca68",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    height: 9,
    width: 9,
    borderRadius: 6,
    backgroundColor: "#fff2d9",
  },
  text: { marginLeft: 10, fontSize: 16, color: "#fcca68" },
});
