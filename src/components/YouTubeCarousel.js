import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchYouTubeVideos } from '../services/youtube';

export default function YouTubeCarousel({ query, title = 'Videos para ti' }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    searchYouTubeVideos(query).then((results) => {
      setVideos(results);
      setLoading(false);
    });
  }, [query]);

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator color="#D6A4A4" />
      </View>
    );
  }

  if (videos.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name="logo-youtube" size={16} color="#FF4444" />
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${item.id}`)}
          >
            <View style={styles.thumbWrap}>
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={34} color="rgba(255,255,255,0.92)" />
              </View>
            </View>
            <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.channel} numberOfLines={1}>{item.channel}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
    marginTop: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  list: {
    paddingBottom: 4,
    paddingRight: 4,
    gap: 12,
  },
  card: {
    width: 190,
  },
  thumbWrap: {
    width: 190,
    height: 107,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EDD0E2',
    marginBottom: 8,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2D2D',
    lineHeight: 18,
    marginBottom: 3,
  },
  channel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
});
