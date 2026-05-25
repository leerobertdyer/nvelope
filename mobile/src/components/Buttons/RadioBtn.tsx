import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface RadioBtn {
  id: string;
  label: string;
}
export default function RadioBtnGroup({ option, onSelect }: { option: RadioBtn, onSelect: (value: string) => void}) {
  const [selected, setSelected] = useState(null);

  const handlePress = (value: any) => {
    setSelected(value);
    onSelect(value);
  };

  return (
    <View>
        <TouchableOpacity 
          key={option.id} 
          style={styles.container} 
          onPress={() => handlePress(option.id)}
        >
          <View style={styles.outerCircle}>
            {selected === option.id && <View style={styles.innerCircle} />}
          </View>
          <Text style={styles.text}>{option.label}</Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  outerCircle: {
    height: 24, width: 24, borderRadius: 12, borderWidth: 2,
    borderColor: '#007BFF', alignItems: 'center', justifyContent: 'center',
  },
  innerCircle: { height: 12, width: 12, borderRadius: 6, backgroundColor: '#007BFF' },
  text: { marginLeft: 10, fontSize: 16 },
});