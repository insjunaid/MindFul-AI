import nltk
from textblob import TextBlob
from transformers import pipeline
import re
from collections import Counter
import numpy as np

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('vader_lexicon')

from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

class MentalHealthNLP:
    def __init__(self):
        print("Loading NLP models...")
        # Load emotion detection model
        self.emotion_classifier = pipeline(
            "text-classification", 
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None
        )
        
        # Initialize sentiment analyzer
        self.sia = SentimentIntensityAnalyzer()
        
        # Crisis keywords
        self.crisis_keywords = [
            'suicide', 'kill myself', 'end my life', 'want to die', 
            'no reason to live', 'better off dead', 'self harm',
            'hurt myself', 'cutting myself', 'overdose'
        ]
        
        # Coping strategies database
        self.coping_strategies = {
            'sadness': [
                'Practice gratitude journaling - write 3 things you\'re grateful for',
                'Reach out to a friend or loved one',
                'Engage in physical exercise - even a short walk helps',
                'Listen to uplifting music or watch a comfort show',
                'Practice self-compassion meditation'
            ],
            'anger': [
                'Try the 4-7-8 breathing technique',
                'Physical exercise to release tension',
                'Write down your feelings without filter',
                'Count to 10 slowly before reacting',
                'Progressive muscle relaxation'
            ],
            'anxiety': [
                'Practice deep breathing: inhale for 4, hold for 4, exhale for 4',
                'Use the 5-4-3-2-1 grounding technique',
                'Challenge anxious thoughts with evidence',
                'Limit caffeine and get adequate sleep',
                'Try guided meditation apps'
            ],
            'fear': [
                'Identify and name your specific fear',
                'Practice gradual exposure in a safe way',
                'Talk to someone you trust',
                'Focus on what you can control',
                'Use positive affirmations'
            ],
            'joy': [
                'Savor this moment mindfully',
                'Share your joy with others',
                'Write about what made you happy',
                'Take a mental snapshot to remember this feeling',
                'Pay it forward with a kind gesture'
            ],
            'neutral': [
                'Set a small achievable goal for today',
                'Try something new or creative',
                'Connect with nature',
                'Practice mindfulness meditation',
                'Reflect on your personal values'
            ]
        }
        
        print("NLP models loaded successfully!")
    
    def detect_crisis(self, text):
        """Detect potential crisis situations"""
        text_lower = text.lower()
        for keyword in self.crisis_keywords:
            if keyword in text_lower:
                return True
        return False
    
    def analyze_emotion(self, text):
        """Detect emotions using transformer model"""
        emotions = self.emotion_classifier(text[:512])[0]  # Limit text length
        
        # Sort by score
        emotions_sorted = sorted(emotions, key=lambda x: x['score'], reverse=True)
        
        return {
            'primary_emotion': emotions_sorted[0]['label'],
            'confidence': emotions_sorted[0]['score'],
            'all_emotions': [
                {'emotion': e['label'], 'score': round(e['score'], 3)} 
                for e in emotions_sorted
            ]
        }
    
    def analyze_sentiment(self, text):
        """Analyze sentiment polarity and subjectivity"""
        # VADER sentiment
        vader_scores = self.sia.polarity_scores(text)
        
        # TextBlob sentiment
        blob = TextBlob(text)
        
        return {
            'polarity': round(blob.sentiment.polarity, 3),
            'subjectivity': round(blob.sentiment.subjectivity, 3),
            'vader_compound': round(vader_scores['compound'], 3),
            'vader_positive': round(vader_scores['pos'], 3),
            'vader_negative': round(vader_scores['neg'], 3),
            'vader_neutral': round(vader_scores['neu'], 3)
        }
    
    def extract_keywords(self, text):
        """Extract important keywords"""
        # Tokenize and remove stopwords
        stop_words = set(stopwords.words('english'))
        words = word_tokenize(text.lower())
        
        # Filter words
        keywords = [
            word for word in words 
            if word.isalnum() and word not in stop_words and len(word) > 3
        ]
        
        # Get most common
        word_freq = Counter(keywords)
        return word_freq.most_common(5)
    
    def get_coping_strategies(self, emotion):
        """Get personalized coping strategies"""
        emotion_lower = emotion.lower()
        
        # Map emotions to categories
        emotion_map = {
            'sadness': 'sadness',
            'anger': 'anger',
            'fear': 'fear',
            'anxiety': 'anxiety',
            'joy': 'joy',
            'surprise': 'neutral',
            'disgust': 'anger',
            'neutral': 'neutral'
        }
        
        category = emotion_map.get(emotion_lower, 'neutral')
        strategies = self.coping_strategies.get(category, self.coping_strategies['neutral'])
        
        return np.random.choice(strategies, size=min(3, len(strategies)), replace=False).tolist()
    
    def analyze_text(self, text):
        """Complete text analysis"""
        if not text or len(text.strip()) < 3:
            return {'error': 'Text too short for analysis'}
        
        # Crisis detection
        is_crisis = self.detect_crisis(text)
        
        # Emotion analysis
        emotion_data = self.analyze_emotion(text)
        
        # Sentiment analysis
        sentiment_data = self.analyze_sentiment(text)
        
        # Keywords
        keywords = self.extract_keywords(text)
        
        # Coping strategies
        strategies = self.get_coping_strategies(emotion_data['primary_emotion'])
        
        return {
            'crisis_detected': is_crisis,
            'emotion': emotion_data,
            'sentiment': sentiment_data,
            'keywords': keywords,
            'coping_strategies': strategies,
            'text_length': len(text),
            'word_count': len(text.split())
        }