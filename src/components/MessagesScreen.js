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
} from 'react-native';

const initialPosts = [
  {
    id: '1',
    author: 'María',
    topic: 'Rutina para cabello seco',
    body: '¿Alguien tiene tips para hidratar cabello muy seco sin usar siliconas?',
    comments: [
      { id: '1', author: 'Ana', text: 'Prueba la mascarilla de aguacate una vez por semana.' },
      { id: '2', author: 'Sofía', text: 'Me funcionó mucho el aceite de coco en las puntas.' },
    ],
  },
  {
    id: '2',
    author: 'Claudia',
    topic: 'Cuidado de la piel',
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
  const flatListRef = useRef(null);

  const addPost = () => {
    if (!postTopic.trim() || !postBody.trim()) return;

    const newPost = {
      id: String(posts.length + 1),
      author: 'Tú',
      topic: postTopic.trim(),
      body: postBody.trim(),
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setPostTopic('');
    setPostBody('');
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

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [posts]);

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => setSelectedPost(item)}>
      <View style={styles.postHeader}>
        <Text style={styles.postAuthor}>{item.author}</Text>
        <Text style={styles.commentCount}>{item.comments.length} comentarios</Text>
      </View>
      <Text style={styles.postTopic}>{item.topic}</Text>
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
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.feedContainer}
          ListHeaderComponent={
            <View style={styles.newPostContainer}>
              <Text style={styles.sectionTitle}>Crear un nuevo post</Text>
              <TextInput
                style={styles.input}
                placeholder="Tema (ej. Rutina hidratación)"
                value={postTopic}
                onChangeText={setPostTopic}
              />
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
            </View>
          }
        />
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
  postTopic: {
    fontSize: 18,
    fontWeight: '700',
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
});
