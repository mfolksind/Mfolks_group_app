import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  ScrollView,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '@/design-system';

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  route: string;
  imageUri: string;
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: 'slide-1',
    title: 'Industrial Metal Marketplace',
    subtitle: 'Access quality metal products for domestic & international markets',
    ctaText: 'Browse Products',
    route: '/(tabs)/products',
    imageUri:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'slide-2',
    title: 'Live LME & Domestic Market Rates',
    subtitle: 'Real-time benchmark pricing for Steel, Copper, Aluminium & Zinc',
    ctaText: 'Check Live Rates',
    route: '/live-rates',
    imageUri:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'slide-3',
    title: 'Latest Metal Industry Insights',
    subtitle: 'Stay informed with daily market news, forecasts & tariff updates',
    ctaText: 'Read Articles',
    route: '/industry-news',
    imageUri:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop',
  },
];

interface HeroBannerCarouselProps {
  slides?: BannerSlide[];
  autoScrollInterval?: number;
}

export function HeroBannerCarousel({
  slides = DEFAULT_SLIDES,
  autoScrollInterval = 3800,
}: HeroBannerCarouselProps) {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const isResettingRef = useRef(false);

  // Extend slides array by appending a clone of the first slide at the end
  // This enables a buttery-smooth forward transition instead of a fast backward rewind.
  const extendedSlides = useMemo(() => {
    if (slides.length <= 1) return slides;
    return [...slides, { ...slides[0], id: `${slides[0].id}-clone` }];
  }, [slides]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  useEffect(() => {
    if (containerWidth <= 0 || slides.length <= 1) return;

    const timer = setInterval(() => {
      if (isResettingRef.current) return;

      setActiveIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        scrollViewRef.current?.scrollTo({
          x: nextIndex * containerWidth,
          animated: true,
        });

        // When scrolling to the clone slide at the end (e.g. index 3)
        if (nextIndex === slides.length) {
          isResettingRef.current = true;
          // Wait for smooth forward animation to complete, then silently snap to index 0
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              x: 0,
              animated: false,
            });
            setActiveIndex(0);
            isResettingRef.current = false;
          }, 400); // 400ms matches standard scroll animation duration
        }

        return nextIndex;
      });
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [containerWidth, slides.length, autoScrollInterval]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0 || isResettingRef.current) return;
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(contentOffsetX / containerWidth);

    if (rawIndex >= 0 && rawIndex < extendedSlides.length && rawIndex !== activeIndex) {
      setActiveIndex(rawIndex);
    }
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0) return;
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(contentOffsetX / containerWidth);

    // If manual swipe reached the cloned slide at the end, snap back to real index 0
    if (rawIndex === slides.length) {
      scrollViewRef.current?.scrollTo({
        x: 0,
        animated: false,
      });
      setActiveIndex(0);
    }
  };

  // Compute active pagination dot index (cloned slide maps to dot 0)
  const displayDotIndex = activeIndex % slides.length;

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          decelerationRate="fast"
          style={{ width: containerWidth }}
        >
          {extendedSlides.map((slide, index) => (
            <View
              key={`${slide.id}-${index}`}
              style={[styles.slideContainer, { width: containerWidth }]}
            >
              <ImageBackground
                source={{ uri: slide.imageUri }}
                style={styles.imageBackground}
                imageStyle={styles.imageStyle}
              >
                {/* Dark Overlay for visual excellence & text readability */}
                <View style={styles.darkOverlay}>
                  <View style={styles.content}>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.subtitle} numberOfLines={2}>
                      {slide.subtitle}
                    </Text>
                    <Pressable
                      style={styles.ctaButton}
                      onPress={() => router.push(slide.route as never)}
                    >
                      <Text style={styles.ctaText}>{slide.ctaText}</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={colors.primary}
                      />
                    </Pressable>
                  </View>
                </View>
              </ImageBackground>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Pagination Indicator Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === displayDotIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    height: 190,
  },
  slideContainer: {
    height: 190,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  imageStyle: {
    borderRadius: radius.lg,
    resizeMode: 'cover',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    padding: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  content: {
    maxWidth: '90%',
  },
  title: {
    ...typography.heading2,
    color: colors.textInverse,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 4,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.9,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textInverse,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  ctaText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: colors.textInverse,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
