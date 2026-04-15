import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

type YearPickerProps = {
  value: string;
  onChange: (year: string) => void;
  minYear?: number;
  maxYear?: number;
  onSelect?: () => void;
};

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 64;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export default function YearPicker({
  value,
  onChange,
  minYear = 1950,
  maxYear = new Date().getFullYear(),
  onSelect,
}: YearPickerProps) {
  const years = useMemo(
    () => {
      const range = [] as string[];
      for (let year = maxYear; year >= minYear; year--) {
        range.push(String(year));
      }
      return range;
    },
    [minYear, maxYear]
  );

  const selectedIndex = Math.max(years.indexOf(value), 0);
  const listRef = useRef<FlatList<string> | null>(null);

  useEffect(() => {
    if (selectedIndex >= 0) {
      listRef.current?.scrollToIndex({ index: selectedIndex, animated: false });
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const year = years[index];
    if (year && year !== value) {
      onChange(year);
    }
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = index === selectedIndex;
    return (
      <View style={styles.itemContainer}>
        <Text style={[styles.yearText, isSelected ? styles.activeYearText : styles.inactiveYearText]}>
          {item}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerWrapper}>
        <FlatList
          ref={listRef}
          data={years}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          contentContainerStyle={styles.flatListContent}
          initialScrollIndex={selectedIndex}
          style={styles.flatList}
        />
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.highlightLine} />
        </View>
      </View>
      {onSelect ? (
        <TouchableOpacity style={styles.selectButton} activeOpacity={0.8} onPress={onSelect}>
          <Text style={styles.selectButtonText}>Seleccionar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  pickerWrapper: {
    width: '100%',
    height: PICKER_HEIGHT,
    justifyContent: 'center',
  },
  flatList: {
    width: '100%',
  },
  flatListContent: {
    paddingTop: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    paddingBottom: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearText: {
    textAlign: 'center',
  },
  activeYearText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  inactiveYearText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999999',
    opacity: 0.5,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 140, 150, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 140, 150, 0.3)',
  },
  selectButton: {
    marginTop: 18,
    width: '100%',
    backgroundColor: '#D6A4A4',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
