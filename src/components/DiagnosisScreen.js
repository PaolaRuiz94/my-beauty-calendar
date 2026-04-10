import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const questions = [
  {
    id: 'oleosidad',
    question: '¿Cómo es la raíz de tu cabello?',
    options: ['Grasa', 'Normal', 'Seca'],
  },
  {
    id: 'puntas',
    question: '¿Cómo sientes las puntas?',
    options: ['Secas', 'Suaves', 'Quebradizas'],
  },
  {
    id: 'frizz',
    question: 'Nivel de frizz:',
    options: ['Alto', 'Medio', 'Bajo'],
  },
];

// 🛍️ PRODUCTOS
const productDB = {
  hidratacion: [
    {
      name: 'Mascarilla hidratante con argán',
      link: 'https://www.amazon.com',
    },
  ],
  frizz: [
    {
      name: 'Sérum antifrizz',
      link: 'https://www.mercadolibre.com',
    },
    {
      name: 'Funda de satín (Malma 💖)',
      link: 'https://www.amazon.com',
    },
  ],
  oleosidad: [
    {
      name: 'Shampoo balanceante',
      link: 'https://www.falabella.com',
    },
  ],
};

export default function DiagnosisScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [image, setImage] = useState(null);
  const [products, setProducts] = useState([]);

  // 📸 IMAGEN
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permiso requerido');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // ➡️ SIGUIENTE
  const handleNext = () => {
    if (!selectedOption) return;

    const key = questions[currentQuestion].id;

    const newAnswers = {
      ...answers,
      [key]: selectedOption,
    };

    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      generateResult(newAnswers);
    }
  };

  // 🧠 RESULTADO + PRODUCTOS
  const generateResult = (answers) => {
    let perfil = '';
    let rutina = [];
    let recommendedProducts = [];

    if (answers.oleosidad === 'Grasa') {
      perfil += 'Raíz grasa\n';
      rutina.push('Shampoo balanceante');
      recommendedProducts.push(...productDB.oleosidad);
    }

    if (answers.puntas === 'Secas') {
      perfil += 'Puntas secas\n';
      rutina.push('Mascarilla hidratante');
      recommendedProducts.push(...productDB.hidratacion);
    }

    if (answers.frizz === 'Alto') {
      perfil += 'Alto frizz\n';
      rutina.push('Usar productos antifrizz');
      recommendedProducts.push(...productDB.frizz);
    }

    setProducts(recommendedProducts);

    setResult({
      perfil,
      rutina,
    });
  };

  const openLink = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Diagnóstico Capilar</Text>

      {!result ? (
        <>
          {/* IMAGEN */}
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadText}>
              {image ? 'Cambiar foto' : 'Subir foto'}
            </Text>
          </TouchableOpacity>

          {image && <Image source={{ uri: image }} style={styles.image} />}

          {/* PREGUNTA */}
          <Text style={styles.question}>
            {questions[currentQuestion].question}
          </Text>

          {/* OPCIONES */}
          {questions[currentQuestion].options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                selectedOption === option && styles.optionSelected,
              ]}
              onPress={() => setSelectedOption(option)}
            >
              <Text>{option}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Siguiente</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.resultTitle}>Tu resultado ✨</Text>

          {image && <Image source={{ uri: image }} style={styles.image} />}

          <Text style={styles.resultText}>{result.perfil}</Text>

          <Text style={styles.subtitle}>Rutina:</Text>
          {result.rutina.map((item, i) => (
            <Text key={i}>• {item}</Text>
          ))}

          <Text style={styles.subtitle}>Productos recomendados 🛍️</Text>

          {products.map((product, index) => (
            <TouchableOpacity
              key={index}
              style={styles.productCard}
              onPress={() => openLink(product.link)}
            >
              <Text style={styles.productText}>{product.name}</Text>
              <Text style={styles.buy}>Comprar →</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setResult(null);
              setAnswers({});
              setCurrentQuestion(0);
              setImage(null);
              setProducts([]);
            }}
          >
            <Text>Repetir</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5F5DC',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadText: { color: '#fff' },
  image: {
    width: 200,
    height: 200,
    borderRadius: 15,
    alignSelf: 'center',
    marginBottom: 10,
  },
  question: {
    fontSize: 18,
    marginVertical: 10,
    textAlign: 'center',
  },
  option: {
    padding: 15,
    backgroundColor: '#fff',
    marginVertical: 5,
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: '#D4AF37',
  },
  nextButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  nextText: { color: '#fff' },
  resultTitle: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  resultText: {
    marginBottom: 10,
  },
  subtitle: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  productText: {
    fontSize: 16,
  },
  buy: {
    marginTop: 5,
    color: '#D4AF37',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#D4AF37',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});