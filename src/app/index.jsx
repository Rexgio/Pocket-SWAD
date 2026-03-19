import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  StatusBar,
  Image, // IMPORTAMOS IMAGE AQUÍ
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const UGR_RED = "#c1002b";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null); // Corregido para JSX

  const handleLogin = () => {
    if (!userId.trim() || !password.trim()) {
      setError("Introduce tus credenciales de SWAD.");
      return;
    }
    setError("");
    setLoading(true);
    login({ userId: userId.trim(), password });
    setTimeout(() => setLoading(false), 2000);
  };

  const theme = {
    bgTop: isDark ? "#121212" : UGR_RED,
    bgBottom: isDark ? "#000000" : "#F8FAFC",
    card: isDark ? "#1E1E1E" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#0F172A",
    textSub: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#262626" : "#F1F5F9",
    inputText: isDark ? "#F8FAFC" : "#1E293B",
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bgBottom }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* Fondo Decorativo */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "45%",
          backgroundColor: theme.bgTop,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginTop: insets.top + 20,
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          {/* Contenedor del Logo con sombras */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 30,
              backgroundColor: isDark ? "#222" : "#FFF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 15,
              elevation: 10,
              overflow: "hidden", // Asegura que la imagen respete el border radius del contenedor
            }}
          >
            {/* ── CAMBIO AQUÍ: Imagen de SWAD ─────────────────────────────── */}
            <Image
              source={require("../../assets/images/swad.png")}
              style={{
                width: "80%", // Ajusta el tamaño de la imagen dentro del contenedor
                height: "80%",
              }}
              resizeMode="contain" // Mantiene la proporción de la imagen
            />
            {/* ───────────────────────────────────────────────────────────── */}
          </View>
          <Text style={{ fontSize: 32, fontWeight: "800", color: "#FFF" }}>
            SWAD UGR
          </Text>
        </View>

        {/* Tarjeta de Login (igual que antes) */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 32,
            padding: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.08,
            shadowRadius: 30,
            elevation: 8,
          }}
        >
          {/* Inputs, Error y Botón (sin cambios) */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: theme.textSub,
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              USUARIO
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg,
                borderRadius: 16,
                padding: 16,
                fontSize: 16,
                color: theme.inputText,
                borderWidth: 1.5,
                borderColor: focusedInput === "user" ? UGR_RED : "transparent",
              }}
              placeholder="DNI o correo"
              value={userId}
              onChangeText={setUserId}
              onFocus={() => setFocusedInput("user")}
              onBlur={() => setFocusedInput(null)}
              autoCapitalize="none"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                color: theme.textSub,
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              CONTRASEÑA
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.inputBg,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: focusedInput === "pass" ? UGR_RED : "transparent",
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 16,
                  color: theme.inputText,
                }}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("pass")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={{ padding: 16 }}
              >
                <Ionicons
                  name={showPass ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSub}
                />
              </TouchableOpacity>
            </View>
          </View>

          {!!error && (
            <Text
              style={{ color: "#EF4444", textAlign: "center", marginTop: 10 }}
            >
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: UGR_RED,
              borderRadius: 18,
              padding: 16,
              alignItems: "center",
              marginTop: 30,
              elevation: 5,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: "#FFF", fontWeight: "700" }}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
