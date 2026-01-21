import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './context/AppContext';

// Screens
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import CreateRxScreen from './screens/CreateRxScreen';
import PreviewPdfScreen from './screens/PreviewPdfScreen';
import WalletScreen from './screens/WalletScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateRx" component={CreateRxScreen} options={{ title: 'New Prescription', headerShown: true }} />
          <Stack.Screen name="PreviewPdf" component={PreviewPdfScreen} options={{ title: 'Preview', headerShown: true }} />
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet', headerShown: true }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerShown: true }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}