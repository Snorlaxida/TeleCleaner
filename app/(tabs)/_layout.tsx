import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0088cc',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5ea',
        },
        headerStyle: {
          backgroundColor: '#0088cc',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💬</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}
