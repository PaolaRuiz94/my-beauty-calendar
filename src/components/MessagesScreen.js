import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';

const initialPosts = [
  {
    id: '1',
    author: 'María',
    topic: 'Hair',
    category: 'hair',
    body: '¿Alguien tiene tips para hidratar cabello muy seco sin usar siliconas?',
    comments: [
      { id: '1', author: 'Ana', text: 'Prueba la mascarilla de aguacate una vez por semana.' },
      { id: '2', author: 'Sofía', text: 'Me funcionó mucho el aceite de coco en las puntas.' },
    ],
  },
  {
    id: '2',
    author: 'Claudia',
    topic: 'Skincare',
    category: 'skincare',
    body: 'Busco un serum ligero para piel mixta y sensible.',
    comments: [
      { id: '1', author: 'Laura', text: 'Busca productos con niacinamida y sin fragancia.' },
    ],
  },
];

export default function MessagesScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [posts, setPosts] = useState(initialPosts);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postTopic, setPostTopic] = useState('');
  const [postBody, setPostBody] = useState('');
  const [commentText, setCommentText] = useState('');
  const [transitionCommentText, setTransitionCommentText] = useState('');
  const [transitionComments, setTransitionComments] = useState([]);
  const [transitionLiked, setTransitionLiked] = useState(false);
  const [transitionLikes, setTransitionLikes] = useState(12);
  const [showTransitionComments, setShowTransitionComments] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [creatingPost, setCreatingPost] = useState(false);
  const flatListRef = useRef(null);

  const addPost = () => {
    if (!postTopic.trim() || !postBody.trim()) return;

    const newPost = {
      id: String(posts.length + 1),
      author: 'Tú',
      topic: postTopic === 'hair' ? 'Hair' : 'Skincare',
      category: postTopic,
      body: postBody.trim(),
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setPostTopic('');
    setPostBody('');
    setCreatingPost(false);
  };

  const addComment = () => {
    if (!commentText.trim() || !selectedPost) return;

    const newComment = {
      id: String(selectedPost.comments.length + 1),
      author: 'Tú',
      text: commentText.trim(),
    };

    setPosts((prev) =>
      prev.map((post) =>
        post.id === selectedPost.id
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );

    setSelectedPost((prev) => ({
      ...prev,
      comments: [...prev.comments, newComment],
    }));
    setCommentText('');
  };

  const addTransitionComment = () => {
    if (!transitionCommentText.trim()) return;

    const newComment = {
      id: String(transitionComments.length + 1),
      author: 'Tú',
      text: transitionCommentText.trim(),
    };

    setTransitionComments((prev) => [...prev, newComment]);
    setTransitionCommentText('');
  };

  const toggleTransitionLike = () => {
    setTransitionLiked((prev) => !prev);
    setTransitionLikes((prev) => prev + (transitionLiked ? -1 : 1));
  };

  const filteredPosts =
    selectedFilter === 'all'
      ? posts
      : posts.filter((post) => post.category === selectedFilter);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [posts, selectedFilter]);

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => setSelectedPost(item)}>
      <View style={styles.postHeader}>
        <Text style={styles.postAuthor}>{item.author}</Text>
        <Text style={styles.commentCount}>{item.comments.length} comentarios</Text>
      </View>
      <Text style={styles.categoryLabel}>{item.topic}</Text>
      <Text style={styles.postBody}>{item.body}</Text>
    </TouchableOpacity>
  );

  const renderComment = ({ item }) => (
    <View style={styles.commentCard}>
      <Text style={styles.commentAuthor}>{item.author}</Text>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <AppHeader />
      <Text style={styles.subtitle}>Publica un tema o comenta sobre cuidado capilar y skin care.</Text>

      {!selectedPost ? (
        creatingPost ? (
          <View style={styles.newPostScreen}>
            <Text style={styles.sectionTitle}>Nueva publicación</Text>
            <Text style={styles.topicLabel}>Tema</Text>
            <View style={styles.topicRow}>
              <TouchableOpacity
                style={[
                  styles.topicOption,
                  postTopic === 'hair' && styles.topicOptionSelected,
                ]}
                onPress={() => setPostTopic('hair')}
              >
                <Text
                  style={[
                    styles.topicOptionText,
                    postTopic === 'hair' && styles.topicOptionTextSelected,
                  ]}
                >
                  Hair
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.topicOption,
                  postTopic === 'skincare' && styles.topicOptionSelected,
                ]}
                onPress={() => setPostTopic('skincare')}
              >
                <Text
                  style={[
                    styles.topicOptionText,
                    postTopic === 'skincare' && styles.topicOptionTextSelected,
                  ]}
                >
                  Skincare
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Escribe tu pregunta o comentario..."
              value={postBody}
              onChangeText={setPostBody}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={addPost}>
              <Text style={styles.sendText}>Publicar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setCreatingPost(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : showTransitionComments ? (
          <View style={styles.commentsScreen}>
            <View style={styles.commentPageHeader}>
              <Text style={styles.commentPageTitle}>Comentarios</Text>
              <TouchableOpacity onPress={() => setShowTransitionComments(false)}>
                <Text style={styles.commentPageClose}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={transitionComments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentCard}>
                  <Text style={styles.commentAuthor}>{item.author}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Aún no hay comentarios.</Text>}
            />
            <TextInput
              style={[styles.input, styles.transitionInput]}
              placeholder="Escribe un comentario"
              value={transitionCommentText}
              onChangeText={setTransitionCommentText}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={addTransitionComment}>
              <Text style={styles.sendText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={filteredPosts}
              keyExtractor={(item) => item.id}
              renderItem={renderPost}
              contentContainerStyle={styles.feedContainer}
              ListHeaderComponent={
                <>
                      <View style={styles.transitionCardOuter}>
                    <ImageBackground
                      source={{
                        uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
                      }}
                      style={styles.transitionCard}
                      imageStyle={styles.transitionImage}
                    >
                      <View style={styles.transitionOverlay}>
                        <Text style={styles.transitionTitle}>
                          ¿Estás pasando por una transición capilar?
                        </Text>
                        <Text style={styles.transitionBody}>
                          ¿Quieres contarnos cómo ha sido el proceso?
                        </Text>
                        <View style={styles.actionRow}> 
                          <TouchableOpacity
                            style={[
                              styles.likeButton,
                              transitionLiked && styles.likedButton,
                            ]}
                            onPress={toggleTransitionLike}
                            accessibilityRole="button"
                            accessibilityLabel="Me gusta"
                            accessibilityState={{ selected: transitionLiked }}
                          >
                            <Text style={styles.likeButtonText}>
                              ❤️
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.commentIconButton}
                            onPress={() => setShowTransitionComments(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Ver comentarios"
                          >
                            <Text style={styles.commentIconText}>💬</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ImageBackground>
                  </View>

                  <View style={styles.topicRow}>
                    <TouchableOpacity
                      style={[
                        styles.topicOption,
                        selectedFilter === 'all' && styles.topicOptionSelected,
                      ]}
                      onPress={() => setSelectedFilter('all')}
                    >
                    <Text
                      style={[
                        styles.topicOptionText,
                        selectedFilter === 'all' && styles.topicOptionTextSelected,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.topicOption,
                      selectedFilter === 'hair' && styles.topicOptionSelected,
                    ]}
                    onPress={() => setSelectedFilter('hair')}
                  >
                    <Text
                      style={[
                        styles.topicOptionText,
                        selectedFilter === 'hair' && styles.topicOptionTextSelected,
                      ]}
                    >
                      Hair
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.topicOption,
                      selectedFilter === 'skincare' && styles.topicOptionSelected,
                    ]}
                    onPress={() => setSelectedFilter('skincare')}
                  >
                    <Text
                      style={[
                        styles.topicOptionText,
                        selectedFilter === 'skincare' && styles.topicOptionTextSelected,
                      ]}
                    >
                      Skincare
                    </Text>
                  </TouchableOpacity>
                </View>
                </>
              }
            />
            <TouchableOpacity style={styles.createButton} onPress={() => setCreatingPost(true)}>
              <Text style={styles.createButtonText}>Nueva publicación</Text>
            </TouchableOpacity>
          </>
        )
      ) : (
        <View style={styles.detailContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedPost(null)}>
            <Text style={styles.backText}>← Volver al feed</Text>
          </TouchableOpacity>
          <View style={styles.postCardDetail}>
            <Text style={styles.postAuthor}>{selectedPost.author}</Text>
            <Text style={styles.postTopic}>{selectedPost.topic}</Text>
            <Text style={styles.postBody}>{selectedPost.body}</Text>
          </View>

          <Text style={styles.sectionTitle}>Comentarios</Text>
          <FlatList
            data={selectedPost.comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={styles.commentList}
            ListEmptyComponent={<Text style={styles.emptyText}>Sé el primero en comentar.</Text>}
          />

          <View style={styles.commentInputRow}>
            <TextInput
              style={[styles.input, styles.commentInput]}
              placeholder="Escribe un comentario..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={addComment}>
              <Text style={styles.sendText}>Comentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAF8F6',
    },
    header: {
      padding: 20,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      marginBottom: 10,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      marginTop: 12,
      marginBottom: 18,
      textAlign: 'center',
    },
    feedContainer: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    newPostContainer: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: colors.textPrimary,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
      fontSize: 15,
      color: colors.textPrimary,
    },
    topicLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 10,
      color: colors.textPrimary,
    },
    topicRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    categoryLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.secondary,
      marginBottom: 8,
    },
    postTopic: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
      color: colors.textPrimary,
    },
    topicOption: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 12,
      marginRight: 10,
      alignItems: 'center',
    },
    topicOptionSelected: {
      backgroundColor: colors.primary,
    },
    topicOptionText: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    topicOptionTextSelected: {
      color: colors.white,
      fontWeight: '700',
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    newPostScreen: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.surface,
    },
    createButton: {
      marginHorizontal: 16,
      marginBottom: 20,
      backgroundColor: colors.primary,
      borderRadius: 24,
      paddingVertical: 16,
      alignItems: 'center',
    },
    createButtonText: {
      color: colors.white,
      fontWeight: 'bold',
      fontSize: 16,
    },
    cancelButton: {
      marginTop: 10,
      borderRadius: 20,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 14,
      alignItems: 'center',
    },
    sendText: {
      color: colors.white,
      fontWeight: 'bold',
    },
    postCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
    },
    postHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    postAuthor: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    commentCount: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    categoryLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.secondary,
      marginBottom: 8,
    },
    postBody: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    detailContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    backButton: {
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
    backText: {
      color: colors.textPrimary,
      fontSize: 15,
    },
    postCardDetail: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 20,
    },
    commentList: {
      paddingBottom: 20,
    },
    commentCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
    },
    commentAuthor: {
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.textPrimary,
    },
    commentText: {
      color: colors.textPrimary,
      fontSize: 15,
    },
    emptyText: {
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 10,
    },
    commentInputRow: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    commentInput: {
      marginBottom: 10,
      minHeight: 50,
      backgroundColor: colors.card,
      borderRadius: 16,
      color: colors.textPrimary,
    },
    transitionCardOuter: {
      width: '100%',
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 24,
      overflow: 'hidden',
      alignSelf: 'center',
    },
    transitionCard: {
      height: 220,
      width: '100%',
      backgroundColor: colors.primary,
    },
    transitionImage: {
      resizeMode: 'cover',
    },
    transitionOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
    },
    likeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.softWhite,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    likedButton: {
      backgroundColor: 'rgba(194, 140, 168, 0.22)',
    },
    likeButtonText: {
      fontSize: 18,
      color: colors.textPrimary,
    },
    commentIconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.softWhite,
      justifyContent: 'center',
      alignItems: 'center',
    },
    commentIconText: {
      fontSize: 18,
    },
    transitionCommentsPage: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 16,
    },
    commentsScreen: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      backgroundColor: colors.background,
    },
    commentPageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    commentPageTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    commentPageClose: {
      color: colors.secondary,
      fontWeight: '700',
    },
    transitionInput: {
      minHeight: 90,
      marginBottom: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 14,
      color: colors.textPrimary,
    },
    transitionCommentList: {
      marginTop: 10,
    },
    transitionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.softWhite,
      textAlign: 'center',
    },
    transitionBody: {
      fontSize: 15,
      color: colors.softWhite,
      marginBottom: 12,
      textAlign: 'center',
    },
  });
