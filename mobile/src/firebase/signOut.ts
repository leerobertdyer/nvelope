import auth from "@react-native-firebase/auth";

export default async function signout() {
    return auth().signOut().then(() => {
        console.log('User signed out successfully');
    }).catch((e) => {
        console.error(e)
    });
}
