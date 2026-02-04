import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import YoutubePlayer from 'react-native-youtube-iframe';
import { extractYouTubeId } from '@/src/utils/youtube';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate dimensions for center-cropped 16:9 video in full-screen portrait
// We want to fill the height and crop the sides for TikTok-like feel
const VIDEO_HEIGHT = SCREEN_HEIGHT;
const VIDEO_WIDTH = (VIDEO_HEIGHT * 16) / 9; // Maintain 16:9 aspect ratio

interface ReelVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  isActive: boolean;
  onVideoEnd?: () => void;
}

export function ReelVideoPlayer({
  videoUrl,
  thumbnailUrl,
  isActive,
  onVideoEnd,
}: ReelVideoPlayerProps) {
  const videoId = extractYouTubeId(videoUrl);

  const onStateChange = useCallback(
    (state: string) => {
      if (state === 'ended' && onVideoEnd) {
        onVideoEnd();
      }
    },
    [onVideoEnd]
  );

  if (!videoId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Image
            source={{ uri: thumbnailUrl || `https://img.youtube.com/vi/default/hqdefault.jpg` }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        </View>
      </View>
    );
  }

  // Show thumbnail when not active for performance
  if (!isActive) {
    const thumb = thumbnailUrl || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    return (
      <View style={styles.container}>
        <Image source={{ uri: thumb }} style={styles.thumbnail} contentFit="cover" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Center-crop container for TikTok-like feel */}
      <View style={styles.videoWrapper}>
        <YoutubePlayer
          height={VIDEO_HEIGHT}
          width={VIDEO_WIDTH}
          videoId={videoId}
          play={isActive}
          onChangeState={onStateChange}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          }}
          initialPlayerParams={{
            controls: false,
            modestbranding: true,
            rel: false,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  errorContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
});
