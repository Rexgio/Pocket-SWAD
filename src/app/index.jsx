import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [userId,   setUserId]   = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = () => {
    if (!userId.trim() || !password.trim()) {
      setError('Introduce tu usuario y contraseña.');
      return;
    }
    setError('');
    setLoading(true);
    // Las credenciales se pasan al contexto;
    // NavigationGuard en _layout redirigirá a /webview
    login({ userId: userId.trim(), password });
    // Por si el guard tarda: resetear loading tras un tick
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-500"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Fondo dividido: azul arriba, gris abajo */}
      <View className="absolute inset-0">
        <View className="bg-brand-500 h-1/2" />
        <View className="bg-slate-100 flex-1" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow items-center justify-center px-5 pb-10 pt-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Logo ─────────────────────────────────────────────────── */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-3 shadow-lg"
            style={{ elevation: 8 }}>
            <Text className="text-5xl font-black text-brand-500">S</Text>
          </View>
          <Text className="text-3xl font-black text-white tracking-widest">
            SWAD UGR
          </Text>
          <Text className="text-xs text-blue-200 mt-1 text-center">
            Sistema Web de Apoyo a la Docencia
          </Text>
        </View>

        {/* ── Tarjeta ──────────────────────────────────────────────── */}
        <View className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-xl"
          style={{ elevation: 10 }}>

          <Text className="text-xl font-bold text-indigo-900 text-center mb-6">
            Iniciar sesión
          </Text>

          {/* Usuario */}
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Usuario
          </Text>
          <TextInput
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 mb-1"
            placeholder="DNI, nick o correo"
            placeholderTextColor="#94a3b8"
            value={userId}
            onChangeText={t => { setUserId(t); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          {/* Contraseña */}
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 mt-4">
            Contraseña
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-1">
            <TextInput
              className="flex-1 px-4 py-3 text-sm text-slate-800"
              placeholder="Contraseña SWAD"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={t => { setPassword(t); setError(''); }}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              className="px-4 py-3"
              onPress={() => setShowPass(v => !v)}
            >
              <Text className="text-lg">{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {!!error && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
              <Text className="text-red-700 text-xs text-center font-medium">
                ⚠️  {error}
              </Text>
            </View>
          )}

          {/* Botón */}
          <TouchableOpacity
            className={`bg-brand-500 rounded-2xl py-4 items-center mt-6 ${loading ? 'opacity-60' : ''}`}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base tracking-wide">Entrar</Text>
            }
          </TouchableOpacity>

          {/* Hint */}
          <Text className="text-center text-slate-400 text-xs mt-4 leading-5">
            Usa tu contraseña interna de SWAD{'\n'}(distinta a la de PRADO / UGR)
          </Text>
        </View>

        {/* Footer */}
        <Text className="text-slate-400 text-xs mt-8">
          swad.ugr.es · Universidad de Granada
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}