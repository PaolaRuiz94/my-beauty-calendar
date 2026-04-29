import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../auth/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { registerWithEmail, googleRequest, promptGoogleAsync } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await registerWithEmail(name, email, password);
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await promptGoogleAsync();
    } catch {
      setError('No se pudo iniciar sesión con Google.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta ✨</Text>
        <Text style={styles.subtitle}>Registra tu diagnóstico y empieza tu rutina personalizada.</Text>

        {/* Google */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogle}
          disabled={!googleRequest}
          activeOpacity={0.85}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Continuar con Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o regístrate con email</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@dominio.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={['#DEB4CC', '#BF789C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, loading && { opacity: 0.7 }]}
            >
              <Text style={styles.buttonText}>{loading ? 'Creando cuenta...' : 'Registrarme'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>  Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },
  content: {
    padding: 24,
    paddingTop: 72,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#AAA',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 20,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  dividerText: {
    fontSize: 12,
    color: '#CCC',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#C47898',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FDF5F8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    color: '#333',
    fontSize: 15,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    color: '#BBB',
    fontSize: 14,
  },
  footerLink: {
    color: '#BF789C',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    color: '#C44569',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 13,
  },
});
