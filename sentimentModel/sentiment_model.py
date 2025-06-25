# sentiment_model.py
import torch
import torch.nn as nn
from transformers import RobertaModel, RobertaTokenizer
import pickle
import json
import os
from sklearn.preprocessing import LabelEncoder

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class DataPreprocessor:
    def __init__(self):
        self.score_ranges = {
            'highly negative': (0.0, 1.9),
            'negative': (2.0, 3.9),
            'neutral': (4.0, 5.9),
            'positive': (6.0, 7.9),
            'highly positive': (8.0, 10.0)
        }
    
    def get_label_from_score(self, score):
        if 0.0 <= score <= 1.9:
            return 'highly negative'
        elif 2.0 <= score <= 3.9:
            return 'negative'
        elif 4.0 <= score <= 5.9:
            return 'neutral'
        elif 6.0 <= score <= 7.9:
            return 'positive'
        elif 8.0 <= score <= 10.0:
            return 'highly positive'
        else:
            return 'neutral'

    def get_score_from_label(self, label):
        label_lower = label.lower()
        if label_lower in self.score_ranges:
            min_score, max_score = self.score_ranges[label_lower]
            return (min_score + max_score) / 2.0
        return 5.0

class EnhancedSentimentClassifier(nn.Module):
    def __init__(self, n_classes, dropout_rate=0.3):
        super().__init__()
        self.n_classes = n_classes
        self.roberta = RobertaModel.from_pretrained('roberta-base')
        hidden_size = self.roberta.config.hidden_size
        self.dropout1 = nn.Dropout(dropout_rate)
        self.shared_layer = nn.Linear(hidden_size, hidden_size // 2)
        self.dropout2 = nn.Dropout(dropout_rate)
        self.classifier = nn.Linear(hidden_size // 2, n_classes)
        self.regressor = nn.Sequential(
            nn.Linear(hidden_size // 2, hidden_size // 4),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_size // 4, 1),
            nn.Sigmoid()
        )
        
    def forward(self, input_ids, attention_mask):
        outputs = self.roberta(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.last_hidden_state[:, 0, :]
        shared_features = self.dropout1(pooled_output)
        shared_features = torch.relu(self.shared_layer(shared_features))
        shared_features = self.dropout2(shared_features)
        classification_output = self.classifier(shared_features)
        regression_output = self.regressor(shared_features)
        return classification_output, regression_output.squeeze()

def load_model_complete(model_dir='enhanced_sentiment_model'):
    with open(os.path.join(model_dir, 'config.json'), 'r') as f:
        config = json.load(f)
    
    model = EnhancedSentimentClassifier(config['n_classes'])
    model.load_state_dict(torch.load(
        os.path.join(model_dir, 'model_weights.pth'),
        map_location=device
    ))
    model.to(device).eval()
    
    tokenizer = RobertaTokenizer.from_pretrained(os.path.join(model_dir, 'tokenizer'))
    
    with open(os.path.join(model_dir, 'label_encoder.pkl'), 'rb') as f:
        label_encoder = pickle.load(f)
    
    with open(os.path.join(model_dir, 'preprocessor.pkl'), 'rb') as f:
        preprocessor = pickle.load(f)
    
    return model, tokenizer, label_encoder, preprocessor, config['max_len']

def predict_sentiment_aligned(text, model, tokenizer, label_encoder, preprocessor, max_len):
    model.eval()
    encoding = tokenizer.encode_plus(
        text,
        add_special_tokens=True,
        max_length=max_len,
        padding='max_length',
        truncation=True,
        return_attention_mask=True,
        return_tensors='pt',
    )
    
    input_ids = encoding['input_ids'].to(device)
    attention_mask = encoding['attention_mask'].to(device)
    
    with torch.no_grad():
        class_output, reg_output = model(input_ids, attention_mask)
        probs = torch.softmax(class_output, dim=1)
        confidence, pred_class = torch.max(probs, dim=1)
        sentiment_label = label_encoder.inverse_transform(pred_class.cpu().numpy())[0]
        raw_score = reg_output.item() * 10.0
        aligned_score = preprocessor.get_score_from_label(sentiment_label)
        final_score = 0.7 * aligned_score + 0.3 * raw_score
        final_score = max(0.0, min(10.0, final_score))
        final_label = preprocessor.get_label_from_score(final_score)
        
        return {
            'sentiment_label': final_label,
            'sentiment_score': round(final_score, 2)
        }