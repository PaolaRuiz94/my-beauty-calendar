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
      <View style={styles.header}>
        <Text style={styles.title}>Comunidad Capilar</Text>
        <Text style={styles.subtitle}>Publica un tema o comenta sobre cuidado capilar y skin care.</Text>
      </View>

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
                          >
                            <Text style={styles.likeButtonText}>
                              ❤️
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.commentIconButton}
                            onPress={() => setShowTransitionComments(true)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  subtitle: {
    color: '#444',
    fontSize: 15,
  },
  feedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  newPostContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0D9BF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F8F2E4',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 10,
    fontSize: 15,
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5E3C',
    marginBottom: 8,
  },
  postTopic: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  topicOption: {
    flex: 1,
    backgroundColor: '#FFF7E8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0D9BF',
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  topicOptionSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#C49A24',
  },
  topicOptionText: {
    fontSize: 15,
    color: '#333',
  },
  topicOptionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  newPostScreen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  createButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#000',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0D9BF',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentCount: {
    fontSize: 13,
    color: '#666',
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5E3C',
    marginBottom: 8,
  },
  postBody: {
    fontSize: 15,
    color: '#333',
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
    color: '#000',
    fontSize: 15,
  },
  postCardDetail: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0D9BF',
  },
  commentList: {
    paddingBottom: 20,
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0D9BF',
  },
  commentAuthor: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    color: '#333',
    fontSize: 15,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  commentInputRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#E0D9BF',
    backgroundColor: '#F5F5DC',
  },
  commentInput: {
    marginBottom: 10,
    minHeight: 50,
  },
  transitionCardOuter: {
    width: '100%',
    marginHorizontal: -16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0D9BF',
    overflow: 'hidden',
  },
  transitionCard: {
    height: 220,
    width: '100%',
    backgroundColor: '#000',
  },
  transitionImage: {
    resizeMode: 'cover',
  },
  transitionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 20,
    justifyContent: 'flex-end',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  likedButton: {
    backgroundColor: '#FDEDEC',
  },
  likeButtonText: {
    fontSize: 18,
  },
  commentIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentIconText: {
    fontSize: 18,
  },
  transitionCommentsPage: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0D9BF',
    padding: 16,
  },
  commentsScreen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F5F5DC',
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
  },
  commentPageClose: {
    color: '#8B5E3C',
    fontWeight: '700',
  },
  transitionInput: {
    minHeight: 90,
    marginBottom: 10,
  },
  transitionCommentList: {
    marginTop: 10,
  },
  transitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  transitionBody: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 12,
  },
});
