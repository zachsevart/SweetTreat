import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/src/contexts/UserContext';
import { authService } from '@/src/services/authService';
import { supabase } from '@/src/services/supabase';
import { router } from 'expo-router';
import { Fonts } from '@/constants/theme';

export default function CreateProfileScreen() {
  const { user, session, refreshProfile } = useUser();
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get user from session if user is not set yet
  const currentUser = user || session?.user;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    if (!currentUser) return null;

    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      // Note: You need to create a storage bucket named 'avatars' in your Supabase dashboard
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        // If storage bucket doesn't exist or there's an error, we'll continue without avatar
        Alert.alert(
          'Upload Failed',
          'Could not upload avatar image. Profile will be created without a profile picture. You can add one later.'
        );
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert(
        'Upload Failed',
        'Could not upload avatar image. Profile will be created without a profile picture.'
      );
      return null;
    }
  };

  const handleCreateProfile = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    try {
      let avatarUrl: string | undefined = undefined;

      if (avatarUri) {
        const uploadedUrl = await uploadAvatar(avatarUri);
        avatarUrl = uploadedUrl || undefined;
      }

      await authService.createProfile({
        id: currentUser.id,
        username: username.trim(),
        avatar_url: avatarUrl,
      });

      await refreshProfile();
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText
          type="title"
          style={[styles.title, { fontFamily: Fonts.rounded }]}>
          Create Your Profile
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Let's set up your profile to get started
        </ThemedText>

        <View style={styles.form}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={pickImage}
              disabled={loading}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarPlaceholderText}>👤</ThemedText>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} disabled={loading}>
              <ThemedText style={styles.changePhotoText}>Tap to add photo</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Username Input */}
          <ThemedView style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
            />
          </ThemedView>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateProfile}
            disabled={loading || !username.trim()}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Create Profile</ThemedText>
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
    maxWidth: 400,
    padding: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 60,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
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
    alignItems: 'center',
    marginTop: 8,
    opacity: 1,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
