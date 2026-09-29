import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_CARD_WIDTH = SCREEN_WIDTH - 48;
const MODAL_VIDEO_HEIGHT = Math.round(MODAL_CARD_WIDTH * 9 / 16);

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },

  // shared header
  header: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // quiz header extras
  quizHeader: {
    paddingHorizontal: 18,
    paddingBottom: 50,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  stepPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 60,
    alignItems: 'center',
  },
  stepPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  progressBar: {
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#fff',
  },

  // quiz slide
  slide: {
    flex: 1,
  },
  slideContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 130,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  question: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 24,
    lineHeight: 30,
  },

  // option cards
  optionsContainer: {
    width: '100%',
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F0DDE2',
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  optionCardActive: {
    borderColor: '#BF789C',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  optionRadioActive: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  optionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  optionTitleActive: {
    color: '#fff',
  },
  optionDesc: {
    fontSize: 13,
    color: '#999',
    lineHeight: 19,
  },
  optionDescActive: {
    color: 'rgba(255,255,255,0.85)',
  },

  // photo upload
  uploadButton: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F0DDE2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadSubText: {
    fontSize: 12,
    color: '#CCC',
    textAlign: 'center',
  },
  uploadImage: {
    width: '100%',
    height: '100%',
  },

  // next button
  nextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backButtonWrapper: {
    flex: 0.35,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 16,
  },
  backText: {
    color: '#D6A4A4',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextButtonWrapper: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 16,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // result header avatar area
  resultAvatarSection: {
    alignItems: 'center',
  },
  resultIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultHairType: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // scroll / sections
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  statChip: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  statChipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CCC',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statChipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    lineHeight: 18,
  },

  // hair image
  hairImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 8,
    resizeMode: 'cover',
  },

  // necesidad principal (nutrición / hidratación / reconstrucción)
  primaryNeedCard: {
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  primaryNeedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryNeedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  primaryNeedTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  primaryNeedDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },

  // card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 28,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5E8EC',
  },

  // routine
  routineRow: {
    paddingVertical: 14,
  },
  routineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  routineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D6A4A4',
    flexShrink: 0,
  },
  routineLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  routineValue: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    paddingLeft: 15,
  },

  // products button
  productsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5C2',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#F0D97A',
    marginBottom: 24,
  },
  productsButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#8A6B00',
  },

  // product categories and cards
  // products
  categoryGroup: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  categoryHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  productRowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productRowTag: {
    backgroundColor: '#FDF0F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  productRowTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6A4A4',
  },

  // tips
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  tipCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6A4A4',
    flexShrink: 0,
  },
  tipTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  tipPreview: {
    fontSize: 13,
    color: '#999',
    lineHeight: 19,
    paddingLeft: 18,
  },

  // frequency
  frequencyRow: {
    paddingVertical: 13,
    gap: 4,
  },
  frequencyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  frequencyValue: {
    fontSize: 13,
    color: '#888',
    lineHeight: 19,
  },

  // action buttons
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 14,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D6A4A4',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#D6A4A4',
    fontWeight: '700',
    fontSize: 15,
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  // modal video flotante
  modalOverlay: {
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
    width: MODAL_CARD_WIDTH,
    shadowColor: '#D6A4A4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
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
  ytPlayerWrap: {
    backgroundColor: '#000',
  },
  ytThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginBottom: 4,
  },
  ytThumb: {
    width: '100%',
    height: '100%',
  },
  ytPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
    gap: 8,
  },
  ytPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ytPlayLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  videoContainer: {
    position: 'relative',
    flex: 1,
  },
  modalVideo: {
    width: MODAL_CARD_WIDTH,
    height: MODAL_VIDEO_HEIGHT,
    backgroundColor: '#1A1A1A',
  },
  expandBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: 'rgba(245,224,236,0.7)',
    lineHeight: 20,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
  },

  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  videosContainer: {
    height: 240,
    marginVertical: 12,
  },
  videosScrollView: {
    flex: 1,
  },
  videoThumbnail: {
    marginHorizontal: 8,
    width: 140,
    alignItems: 'center',
    paddingVertical: 4,
  },
  videoThumbnailImage: {
    width: 140,
    height: 84,
    borderRadius: 8,
    marginBottom: 8,
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoTitle: {
    fontSize: 11,
    color: '#2D2D2D',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    width: 140,
  },
  videoPlaceholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(214, 164, 164, 0.1)',
    borderRadius: 12,
    marginVertical: 12,
  },
  videoPlaceholderText: {
    fontSize: 14,
    color: '#D6A4A4',
    marginTop: 12,
    fontWeight: '600',
  },

  // loading modal
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,45,45,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    width: 200,
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 25,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  spinner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
