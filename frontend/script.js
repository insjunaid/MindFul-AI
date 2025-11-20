// API Configuration
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const userInput = document.getElementById('userInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const charCount = document.querySelector('.char-count');
const loadingState = document.getElementById('loadingState');
const resultsArea = document.getElementById('resultsArea');
const crisisAlert = document.getElementById('crisisAlert');

// Emotion Emojis
const emotionEmojis = {
    'joy': '😊',
    'sadness': '😢',
    'anger': '😠',
    'fear': '😨',
    'surprise': '😲',
    'disgust': '🤢',
    'neutral': '😐',
    'love': '❤️',
    'anxiety': '😰'
};

// Character Counter
userInput.addEventListener('input', () => {
    const count = userInput.value.length;
    charCount.textContent = `${count} / 5000`;
    
    if (count > 4500) {
        charCount.style.color = 'var(--warning-color)';
    } else {
        charCount.style.color = 'var(--text-secondary)';
    }
});

// Analyze Button
analyzeBtn.addEventListener('click', analyzeText);

// Enter to submit (Ctrl+Enter)
userInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        analyzeText();
    }
});

// Main Analysis Function
async function analyzeText() {
    const text = userInput.value.trim();
    
    // Validation
    if (!text) {
        showNotification('Please enter some text to analyze', 'warning');
        return;
    }
    
    if (text.length < 10) {
        showNotification('Please enter at least 10 characters', 'warning');
        return;
    }
    
    // Show loading
    loadingState.classList.remove('hidden');
    resultsArea.classList.add('hidden');
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    
    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            throw new Error('Analysis failed');
        }
        
        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Analysis failed. Please check if the backend is running.', 'error');
    } finally {
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> Analyze Emotions';
    }
}

// Display Results
function displayResults(data) {
    // Show results area
    resultsArea.classList.remove('hidden');
    
    // Scroll to results
    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Crisis Alert
    if (data.crisis_detected) {
        crisisAlert.classList.remove('hidden');
    } else {
        crisisAlert.classList.add('hidden');
    }
    
    // Display Emotion
    displayEmotion(data.emotion);
    
    // Display Sentiment
    displaySentiment(data.sentiment);
    
    // Display Keywords
    displayKeywords(data.keywords);
    
    // Display Strategies
    displayStrategies(data.coping_strategies, data.emotion.primary_emotion);
}

// Display Emotion Results
function displayEmotion(emotion) {
    const emotionResult = document.getElementById('emotionResult');
    const emotionChart = document.getElementById('emotionChart');
    
    const emoji = emotionEmojis[emotion.primary_emotion.toLowerCase()] || '😐';
    const confidence = (emotion.confidence * 100).toFixed(1);
    
    emotionResult.innerHTML = `
        <div class="primary-emotion">${emoji}</div>
        <div class="emotion-label">${emotion.primary_emotion}</div>
        <div class="emotion-confidence">${confidence}% confidence</div>
    `;
    
    // Create emotion chart
    let chartHTML = '';
    emotion.all_emotions.forEach(e => {
        const percentage = (e.score * 100).toFixed(1);
        const emoji = emotionEmojis[e.emotion.toLowerCase()] || '😐';
        
        chartHTML += `
            <div class="emotion-bar">
                <span class="emotion-name">${emoji} ${e.emotion}</span>
                <div class="emotion-progress">
                    <div class="emotion-fill" style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>
            </div>
        `;
    });
    
    emotionChart.innerHTML = chartHTML;
}

// Display Sentiment Results
function displaySentiment(sentiment) {
    const sentimentResult = document.getElementById('sentimentResult');
    
    const polarityClass = sentiment.polarity > 0 ? 'positive' : sentiment.polarity < 0 ? 'negative' : 'neutral';
    const polarityLabel = sentiment.polarity > 0 ? 'Positive' : sentiment.polarity < 0 ? 'Negative' : 'Neutral';
    
    sentimentResult.innerHTML = `
        <div class="sentiment-metric">
            <div class="metric-value ${polarityClass}">${sentiment.polarity}</div>
            <div class="metric-label">Polarity</div>
        </div>
        <div class="sentiment-metric">
            <div class="metric-value">${sentiment.subjectivity}</div>
            <div class="metric-label">Subjectivity</div>
        </div>
        <div class="sentiment-metric">
            <div class="metric-value ${sentiment.vader_positive > 0.5 ? 'positive' : ''}">
                ${(sentiment.vader_positive * 100).toFixed(0)}%
            </div>
            <div class="metric-label">Positive</div>
        </div>
        <div class="sentiment-metric">
            <div class="metric-value ${sentiment.vader_negative > 0.5 ? 'negative' : ''}">
                ${(sentiment.vader_negative * 100).toFixed(0)}%
            </div>
            <div class="metric-label">Negative</div>
        </div>
    `;
}

// Display Keywords
function displayKeywords(keywords) {
    const keywordsResult = document.getElementById('keywordsResult');
    
    if (!keywords || keywords.length === 0) {
        keywordsResult.innerHTML = '<p style="color: var(--text-secondary);">No significant keywords found</p>';
        return;
    }
    
    let keywordsHTML = '';
    keywords.forEach(([word, count]) => {
        keywordsHTML += `
            <div class="keyword-tag">
                <span class="keyword-text">${word}</span>
                <span class="keyword-count">${count}</span>
            </div>
        `;
    });
    
    keywordsResult.innerHTML = keywordsHTML;
}

// Display Coping Strategies
function displayStrategies(strategies, emotion) {
    const strategiesResult = document.getElementById('strategiesResult');
    
    let strategiesHTML = `
        <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
            Based on your <strong>${emotion}</strong>, here are some personalized strategies:
        </p>
    `;
    
    strategies.forEach((strategy, index) => {
        strategiesHTML += `
            <div class="strategy-item" style="animation-delay: ${index * 0.1}s">
                <div class="strategy-icon">💡</div>
                <div class="strategy-text">${strategy}</div>
            </div>
        `;
    });
    
    strategiesResult.innerHTML = strategiesHTML;
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--card-bg);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border-left: 4px solid var(--${type === 'error' ? 'danger' : 'warning'}-color);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    } else {
        navbar.style.boxShadow = 'none';
    }
});

// Add CSS for notifications animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🧠 MindfulAI initialized successfully!');
// ========== ADD THIS TO script.js ==========

// Mobile Hamburger Menu
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});