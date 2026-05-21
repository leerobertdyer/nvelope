import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext/useAuth";
import { loginWithEmailAndPassword } from "../firebase/emailAndPassword";
import { useState } from "react";

export default function Home() {
  const { user, isLoadingUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text>HOME</Text>
      <Text>User: {user ? user.email : "No user"} </Text>
      <TextInput placeholder="email@you.com" onChangeText={(text) => setEmail(text)}/>
      <StatusBar style="auto" />
      <Button title="Submit" onPress={() => loginWithEmailAndPassword(email, password)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
