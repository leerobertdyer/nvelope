import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Ulist = ({data}: {data: any}) => {
  return (
    <View style={styles.container}>
      {data.map((item: any, index: number) => (
        <Text key={index} style={styles.listItem}>
          {`\u2022  ${item}`}
        </Text>
      ))}
    </View>
  );
};

const Olist = ({data}: {data: any}) => {
  return (
    <View style={styles.container}>
      {data.map((item: any, index: number) => (
        <Text key={index} style={styles.listItem}>
          {`${index + 1}. ${item}`}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export {Ulist, Olist};
