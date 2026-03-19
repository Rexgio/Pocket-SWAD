import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../context/AuthContext';

// ── Guard de navegación ──────────────────────────────────────────────────────
// Redirige automáticamente:
//   • Sin sesión  → /           (login)
//   • Con sesión  → /webview    (app principal)
function NavigationGuard() {
  const { session } = useAuth();
  const segments    = useSegments();
  const router      = useRouter();

  useEffect(() => {
    const inLoginScreen = segments[0] === undefined || segments[0] === 'index';

    if (!session && !inLoginScreen) {
      router.replace('/');
    } else if (session && inLoginScreen) {
      router.replace('/webview');
    }
  }, [session, segments]);

  return null;
}

// ── Layout raíz ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#1565c0" />
        <NavigationGuard />

        <Stack
          screenOptions={{
            // Cabecera global: azul UGR
            headerStyle:      { backgroundColor: '#1565c0' },
            headerTintColor:  '#ffffff',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitleVisible: false,
            // Fondo de contenido
            contentStyle:     { backgroundColor: '#f0f4f8' },
            // Animación limpia
            animation: 'slide_from_right',
          }}
        >
          {/* ── Pantalla de login: sin cabecera ── */}
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          />

          {/* ── WebView principal ── */}
          <Stack.Screen
            name="webview"
            options={{
              title: 'SWAD UGR',
              headerShown: false, // La pantalla tiene su propia barra
            }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}