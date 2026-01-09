import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { Collapsible } from '@/components/ui/collapsible';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useUser } from '@/src/contexts/UserContext';

export default function ProfileScreen() {
  const { user, profile, signOut } = useUser();
  const router = useRouter();

  const handleEditProfile = () => {

    router.push('/profile/edit-profile');
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const avatarUrl = profile?.avatar_url;
  const accountCreated = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: 'pink', dark: 'pink' }}
      headerImage={
        <View style={styles.headerImageContainer}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <ThemedText
                type="title"
                style={[
                  styles.avatarText,
                  {
                    fontFamily: Fonts.rounded,
                  },
                ]}>
                👤
              </ThemedText>
            )}
          </View>
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <TouchableOpacity onPress={handleEditProfile}>
          <IconSymbol name="pencil" size={24} color="black" />
        </TouchableOpacity>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Profile
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.profileSection}>
        <ThemedText type="subtitle">{displayName}</ThemedText>
        <ThemedText style={styles.email}>{email}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.statsContainer}>
        <ThemedView style={styles.statItem}>
          <ThemedText type="subtitle" style={styles.statNumber}>
            24
          </ThemedText>
          <ThemedText style={styles.statLabel}>Favorites</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statItem}>
          <ThemedText type="subtitle" style={styles.statNumber}>
            12
          </ThemedText>
          <ThemedText style={styles.statLabel}>Reviews</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statItem}>
          <ThemedText type="subtitle" style={styles.statNumber}>
            8
          </ThemedText>
          <ThemedText style={styles.statLabel}>Visited</ThemedText>
        </ThemedView>
      </ThemedView>

      <Collapsible title="Preferences">
        <ThemedView style={styles.preferenceItem}>
          <ThemedText>
            <ThemedText type="defaultSemiBold">Dietary Restrictions:</ThemedText> None
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.preferenceItem}>
          <ThemedText>
            <ThemedText type="defaultSemiBold">Favorite Cuisine:</ThemedText> Desserts & Pastries
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.preferenceItem}>
          <ThemedText>
            <ThemedText type="defaultSemiBold">Notification Settings:</ThemedText> Enabled
          </ThemedText>
        </ThemedView>
      </Collapsible>

      <Collapsible title="Account Settings">
        <ThemedView style={styles.settingItem}>
          <ThemedText>
            <ThemedText type="defaultSemiBold">Account Created:</ThemedText> {accountCreated}
          </ThemedText>
        </ThemedView>
        {profile?.bio && (
          <ThemedView style={styles.settingItem}>
            <ThemedText>
              <ThemedText type="defaultSemiBold">Bio:</ThemedText> {profile.bio}
            </ThemedText>
          </ThemedView>
        )}
        <ThemedView style={styles.settingItem}>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 60,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  profileSection: {
    gap: 4,
    marginBottom: 24,
  },
  email: {
    opacity: 0.7,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  preferenceItem: {
    marginBottom: 12,
  },
  settingItem: {
    marginBottom: 12,
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
  editProfileButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
