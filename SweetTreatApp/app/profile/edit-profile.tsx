import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/src/contexts/UserContext';
import { authService } from '@/src/services/authService';
import { supabase } from '@/src/services/supabase';
import { router } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useUser();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load existing profile data when component mounts
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUri(profile.avatar_url || null);
    }
    setInitialLoading(false);
  }, [profile]);

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please log in to edit your profile</ThemedText>
      </ThemedView>
    );
  }

  if (initialLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

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
    if (!user) return null;

    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Delete old avatar if it exists
      if (profile?.avatar_url) {
        // Extract the file path from the URL
        const oldUrl = profile.avatar_url;
        const urlParts = oldUrl.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([oldFileName]);
        }
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true, // Allow overwriting if file exists
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        Alert.alert(
          'Upload Failed',
          'Could not upload avatar image. Please try again.'
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
        'Could not upload avatar image. Please try again.'
      );
      return null;
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
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

      // If avatarUri is a local file (starts with file://), upload it
      // If it's already a URL (from existing profile), keep it
      if (avatarUri) {
        if (avatarUri.startsWith('file://') || avatarUri.startsWith('content://')) {
          // New image selected, upload it
          const uploadedUrl = await uploadAvatar(avatarUri);
          avatarUrl = uploadedUrl || profile?.avatar_url || undefined;
        } else {
          // Existing URL, keep it
          avatarUrl = avatarUri;
        }
      }

      // Update profile in database
      await authService.updateProfile(user.id, {
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
      });

      // Refresh profile data in context
      await refreshProfile();

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          onPress={handleCancel} 
          style={styles.cancelButton}
          activeOpacity={0.7}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText
          type="title"
          style={[styles.title, { fontFamily: Fonts.rounded }]}>
          Edit Profile
        </ThemedText>
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={loading || !username.trim()}
          activeOpacity={0.7}
          style={[
            styles.saveButton,
            (!username.trim() || loading) && styles.saveButtonDisabled,
          ]}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.saveText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.content}>
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
              <View style={styles.editIconContainer}>
                <IconSymbol name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} disabled={loading}>
              <ThemedText style={styles.changePhotoText}>Change Photo</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Username Input */}
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Username</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              editable={!loading}
            />
          </ThemedView>

          {/* Bio Input */}
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Bio</ThemedText>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    padding: 8,
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#000',
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 24,
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
    position: 'relative',
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
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  input: {
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    color: '#000',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 16,
  },
});
