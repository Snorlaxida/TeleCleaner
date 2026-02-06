/**
 * Protected Route Component
 * Redirects to auth if user is not authenticated
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { telegramClient } from '@/lib/telegram';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Load session and token into memory
      const sessionData = await telegramClient.loadSession();
      
      if (!sessionData || !telegramClient.isAuthenticated()) {
        console.log('Not authenticated in ProtectedRoute, redirecting to login');
        setIsAuthenticated(false);
        setIsLoading(false);
        router.replace('/(auth)/phone');
        return;
      }

      // User is authenticated
      console.log('User authenticated in ProtectedRoute');
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to check authentication in ProtectedRoute:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
      router.replace('/(auth)/phone');
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0088cc" />
      </View>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
