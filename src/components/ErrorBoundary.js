import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', this.props.label || '', error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="sad-outline" size={32} color="#BF789C" />
        </View>
        <Text style={styles.title}>{this.props.title || 'Algo salió mal'}</Text>
        <Text style={styles.message}>
          {this.props.message || 'Tuvimos un problema al mostrar esta pantalla. Intenta de nuevo.'}
        </Text>
        <TouchableOpacity onPress={this.handleRetry} activeOpacity={0.85} style={styles.buttonWrapper}>
          <LinearGradient
            colors={['#DEB4CC', '#BF789C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Reintentar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }
}

export function withErrorBoundary(Component, boundaryProps) {
  return function Wrapped(props) {
    return (
      <ErrorBoundary {...boundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
