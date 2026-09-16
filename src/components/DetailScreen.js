import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTheme } from '../hooks/useTheme';
import { fetchTipVideo } from '../firebase/videos';

const SCREEN_WIDTH = Dimensions.get('window').width;
const VIDEO_WIDTH = (SCREEN_WIDTH - 48) * 0.6;
const VIDEO_HEIGHT = VIDEO_WIDTH * (16 / 9);

export default function DetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const {
    title = 'Detalle',
    description = 'Selecciona un elemento para ver más detalles.',
    body = '',
    cta = '',
    tipKey = '',
  } = route?.params || {};

  const [videoUri, setVideoUri] = useState(null);
  const player = useVideoPlayer(videoUri, () => {});

  useEffect(() => {
    if (!tipKey) return;
    fetchTipVideo(tipKey).then((data) => {
      if (data?.uri) setVideoUri(data.uri);
    });
  }, [tipKey]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{description}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {cta ? (
            <View style={styles.ctaBox}>
              <Text style={styles.ctaLabel}>Consejo práctico</Text>
              <Text style={styles.ctaText}>{cta}</Text>
            </View>
          ) : null}

          {videoUri ? (
            <View style={styles.videoWrap}>
              <VideoView
                player={player}
                style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}
                contentFit="contain"
                nativeControls
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background || '#FAF8F6',
    },
    container: {
      padding: 24,
      paddingBottom: 48,
      backgroundColor: colors.background || '#FAF8F6',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      marginBottom: 16,
    },
    backButton: {
      marginBottom: 20,
      alignSelf: 'flex-start',
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(90, 42, 116, 0.1)',
      borderRadius: 16,
    },
    backButtonText: {
      color: colors.primary || '#5A2A74',
      fontWeight: '700',
      fontSize: 14,
    },
    header: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.textPrimary || '#1E1E1E',
      marginBottom: 20,
    },
    card: {
      flex: 1,
      backgroundColor: colors.card || '#FFFFFF',
      borderRadius: 28,
      padding: 24,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary || '#1E1E1E',
      marginBottom: 14,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary || '#6B6B6B',
      marginBottom: 18,
    },
    body: {
      fontSize: 16,
      lineHeight: 26,
      color: colors.textSecondary || '#6B6B6B',
      marginBottom: 22,
    },
    ctaBox: {
      backgroundColor: '#F7ECEE',
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#E8D4D6',
    },
    ctaLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary || '#1E1E1E',
      marginBottom: 8,
    },
    ctaText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary || '#6B6B6B',
    },
    videoWrap: {
      marginTop: 24,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#000',
      alignSelf: 'center',
    },
  });
