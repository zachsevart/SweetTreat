import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ReelVideoPlayer } from '@/components/reel-video-player';
import { ReelOverlay } from '@/components/reel-overlay';
import { ErrorState } from '@/components/error-state';
import { videoService } from '@/src/services/videoService';
import { VideoReview, Restaurant } from '@/src/types';
import { Fonts } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

type VideoWithRestaurant = VideoReview & { restaurant?: Restaurant };

export default function ReelsScreen() {
  const [videos, setVideos] = useState<VideoWithRestaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewedVideos = useRef<Set<string>>(new Set());

  // Animation value for vertical swipe
  const translateY = useSharedValue(0);

  // Load videos
  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await videoService.getReelsFeed(30);
      setVideos(data as VideoWithRestaurant[]);
      setCurrentIndex(0);
      viewedVideos.current.clear();
    } catch (err: any) {
      console.error('Error loading reels:', err);
      setError(err.message || 'Failed to load videos.');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Track view when video becomes active
  useEffect(() => {
    const currentVideo = videos[currentIndex];
    if (currentVideo && !viewedVideos.current.has(currentVideo.id)) {
      viewedVideos.current.add(currentVideo.id);
      videoService.incrementViews(currentVideo.id).catch(console.error);
    }
  }, [currentIndex, videos]);

  // Navigate to next video
  const goToNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, videos.length]);

  // Navigate to previous video
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Handle video end - auto advance
  const handleVideoEnd = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      goToNext();
    }
  }, [currentIndex, videos.length, goToNext]);

  // Pan gesture handler for vertical swipe
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Limit overscroll at boundaries
      if (currentIndex === 0 && event.translationY > 0) {
        translateY.value = event.translationY * 0.3; // Resistance at top
      } else if (currentIndex === videos.length - 1 && event.translationY < 0) {
        translateY.value = event.translationY * 0.3; // Resistance at bottom
      } else {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const swipeDistance = event.translationY;

      if (swipeDistance < -SWIPE_THRESHOLD && currentIndex < videos.length - 1) {
        // Swipe up - go to next
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 250 }, () => {
          runOnJS(goToNext)();
          translateY.value = 0;
        });
      } else if (swipeDistance > SWIPE_THRESHOLD && currentIndex > 0) {
        // Swipe down - go to previous
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
          runOnJS(goToPrev)();
          translateY.value = 0;
        });
      } else {
        // Spring back
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  // Animated style for the video container
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Render a video item
  const renderVideo = (video: VideoWithRestaurant, index: number) => {
    const isActive = index === currentIndex;
    const offset = index - currentIndex;

    // Only render prev, current, and next for performance
    if (Math.abs(offset) > 1) return null;

    return (
      <View
        key={video.id}
        style={[
          styles.videoContainer,
          { top: offset * SCREEN_HEIGHT },
        ]}
      >
        <ReelVideoPlayer
          videoUrl={video.video_url}
          thumbnailUrl={video.thumbnail_url}
          isActive={isActive}
          onVideoEnd={handleVideoEnd}
        />
        {isActive && <ReelOverlay video={video} />}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <ThemedText style={styles.loadingText}>Loading reels...</ThemedText>
      </ThemedView>
    );
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={loadVideos} />;
  }

  // No videos state
  if (videos.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText type="title" style={[styles.emptyTitle, { fontFamily: Fonts.rounded }]}>
          No Reels Yet
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Check back later for video reviews!
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.videosWrapper, animatedStyle]}>
          {videos.map((video, index) => renderVideo(video, index))}
        </Animated.View>
      </GestureDetector>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <ThemedText style={styles.progressText}>
          {currentIndex + 1} / {videos.length}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videosWrapper: {
    flex: 1,
    position: 'relative',
  },
  videoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 28,
    marginBottom: 12,
    color: '#fff',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    opacity: 0.7,
    paddingHorizontal: 40,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
