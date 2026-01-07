import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/src/contexts/UserContext';
import { router } from 'expo-router';
import { Fonts } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp, loading } = useUser();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        // Navigate based on profile existence
        if (result.hasProfile) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/auth/create-profile');
        }
      } else {
        await signUp(email, password);
        // Navigate to profile creation for new users
        router.replace('/auth/create-profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText
          type="title"
          style={[styles.title, { fontFamily: Fonts.rounded }]}>
          Sweet Treat Dessert Finder
        </ThemedText>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.tabActive]}
            onPress={() => setIsLogin(true)}
            disabled={loading}>
            <ThemedText style={[styles.tabText, isLogin && styles.tabTextActive]}>
              Sign In
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.tabActive]}
            onPress={() => setIsLogin(false)}
            disabled={loading}>
            <ThemedText style={[styles.tabText, !isLogin && styles.tabTextActive]}>
              Sign Up
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.subtitle}>
          {isLogin ? 'Sign in to continue' : 'Create an account to get started'}
        </ThemedText>

        <View style={styles.form}>
          <ThemedView style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </ThemedView>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    borderRadius: '10%',
    maxWidth: 400,
    padding: 24,
  },
  title: {
    marginBottom: 8,
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    opacity: 0.5,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#000',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  tabTextActive: {
    color: '#000'
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    borderRadius: 12,
    
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderColor: '#000',
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
