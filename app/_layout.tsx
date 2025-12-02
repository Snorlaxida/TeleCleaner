import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0088cc',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(auth)/phone" 
          options={{ 
            title: 'Phone Authentication',
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="(auth)/verify" 
          options={{ 
            title: 'Verify Code',
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
      </Stack>
    </>
  );
}
