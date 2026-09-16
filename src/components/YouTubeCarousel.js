import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Modal, Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubeIframe from 'react-native-youtube-iframe';
import { searchYouTubeVideos } from '../services/youtube';

const { width: SW } = Dimensions.get('window');
const CARD_WIDTH = SW - 40;
const VIDEO_HEIGHT = Math.round(CARD_WIDTH * 9 / 16);

export default function YouTubeCarousel({ query, title = 'Videos para ti' }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
            onPress={() => setSelected(item)}
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

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setSelected(null)}
          accessibilityRole="button"
          accessibilityLabel="Cerrar video"
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleDot} />
              <Text style={styles.modalTitle} numberOfLines={2}>{selected?.title ?? ''}</Text>
              <Pressable
                style={styles.modalClose}
                onPress={() => setSelected(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar video"
              >
                <Ionicons name="close" size={18} color="#D6A4A4" />
              </Pressable>
            </View>
            {selected && (
              <View style={styles.playerWrap}>
                <YoutubeIframe
                  videoId={selected.id}
                  width={CARD_WIDTH}
                  height={VIDEO_HEIGHT}
                  play
                />
              </View>
            )}
            <Text style={styles.channelLabel} numberOfLines={1}>{selected?.channel ?? ''}</Text>
          </Pressable>
        </Pressable>
      </Modal>
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
  // modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,10,20,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#1C1220',
    borderRadius: 24,
    overflow: 'hidden',
    width: CARD_WIDTH,
    shadowColor: '#D6A4A4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(214,164,164,0.3)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  modalTitleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6A4A4',
    flexShrink: 0,
  },
  modalTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#F5E0EC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(214,164,164,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerWrap: {
    backgroundColor: '#000',
  },
  channelLabel: {
    fontSize: 11,
    color: 'rgba(245,224,236,0.5)',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
});
