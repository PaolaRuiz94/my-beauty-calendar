import React, { useState, useMemo } from 'react';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THUMB_GRADIENTS } from '../../data/calendarContent';
import styles from '../CalendarScreen.styles';

export default function ProductThumb({ index, product }) {
  const [fallback, setFallback] = useState(0);

  const src = useMemo(() => {
    if (product?.image && fallback === 0) return { uri: product.image };
    if (!product?.asin || fallback >= 2) return null;
    if (fallback <= 1) return { uri: `https://m.media-amazon.com/images/P/${product.asin}.01._SL500_.jpg` };
    return { uri: `https://images-na.ssl-images-amazon.com/images/P/${product.asin}.01.LZZZZZZZ.jpg` };
  }, [product?.image, product?.asin, fallback]);

  if (!src) {
    const colors = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
    return <LinearGradient colors={colors} style={styles.productThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />;
  }
  return (
    <Image
      source={src}
      style={styles.productThumb}
      resizeMode="cover"
      onError={() => setFallback(f => f + 1)}
    />
  );
}
