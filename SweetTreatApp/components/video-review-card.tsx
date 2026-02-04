import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ThemedText } from '@/components/themed-text';
import { VideoReview } from '@/src/types';
import { extractYouTubeId } from '@/src/utils/youtube';

const PLAYER_WIDTH = Dimensions.get('window').width - 48;
const PLAYER_HEIGHT = (PLAYER_WIDTH * 9) / 16;

interface VideoReviewCardProps {
  video: VideoReview;
}

export function VideoReviewCard({ video }: VideoReviewCardProps) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeId(video.video_url);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  if (!videoId) return null;

  // Show thumbnail until user taps play
  if (!playing) {
    const thumbnailUrl =
      video.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => setPlaying(true)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.playOverlay}>
          <ThemedText style={styles.playIcon}>▶</ThemedText>
        </View>
        {video.views_count > 0 && (
          <View style={styles.viewsBadge}>
            <ThemedText style={styles.viewsText}>
              {video.views_count} views
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <YoutubePlayer
        height={PLAYER_HEIGHT}
        width={PLAYER_WIDTH}
        videoId={videoId}
        play={playing}
        onChangeState={onStateChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  thumbnail: {
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playIcon: {
    fontSize: 48,
    color: '#fff',
  },
  viewsBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewsText: {
    color: '#fff',
    fontSize: 12,
  },
});
