from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import MentalHealthNLP
import logging

app = Flask(__name__)
CORS(app)

# Initialize NLP engine
nlp_engine = MentalHealthNLP()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/')
def home():
    return jsonify({
        'message': 'MindfulAI API is running',
        'version': '1.0.0',
        'endpoints': ['/api/analyze', '/api/health']
    })

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        
        if len(text) > 5000:
            return jsonify({'error': 'Text too long (max 5000 characters)'}), 400
        
        # Perform analysis
        logger.info(f"Analyzing text of length: {len(text)}")
        result = nlp_engine.analyze_text(text)
        
        if 'error' in result:
            return jsonify(result), 400
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in analysis: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/api/resources', methods=['GET'])
def get_resources():
    """Get mental health resources"""
    resources = {
        'crisis_hotlines': [
            {
                'name': 'National Suicide Prevention Lifeline',
                'phone': '988',
                'available': '24/7',
                'country': 'USA'
            },
            {
                'name': 'Crisis Text Line',
                'contact': 'Text HOME to 741741',
                'available': '24/7',
                'country': 'USA'
            },
            {
                'name': 'International Association for Suicide Prevention',
                'website': 'https://www.iasp.info/resources/Crisis_Centres/',
                'country': 'International'
            }
        ],
        'professional_help': [
            'Talk to a licensed therapist',
            'Contact your primary care physician',
            'Visit a local mental health clinic',
            'Check if your school/workplace offers counseling'
        ]
    }
    return jsonify(resources)

if __name__ == '__main__':
    app.run(debug=True, port=5000)