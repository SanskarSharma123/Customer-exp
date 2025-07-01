import React, { useState, useCallback } from "react";
import { apiUrl } from "../config/config";
import RatingStars from "./RatingStars";
import "../css/ReviewForm.css";

// Debounce hook for sentiment preview
const useDebounce = (callback, delay) => {
    const [debounceTimer, setDebounceTimer] = useState(null);
    
    const debouncedCallback = useCallback((...args) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        const newTimer = setTimeout(() => {
            callback(...args);
        }, delay);
        
        setDebounceTimer(newTimer);
    }, [callback, delay, debounceTimer]);
    
    return debouncedCallback;
};

const ReviewForm = ({ productId, onReviewSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sentimentPreview, setSentimentPreview] = useState(null);
    const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

    // Debounced sentiment analysis for preview
    const analyzeSentimentPreview = useCallback(async (text, currentRating) => {
        if (!text.trim() || text.trim().length < 10) {
            setSentimentPreview(null);
            return;
        }

        setIsAnalyzingSentiment(true);
        
        try {
            const response = await fetch(`${apiUrl}/analyze-sentiment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    text: text.trim(),
                    rating: currentRating || null
                }),
                credentials: "include"
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSentimentPreview(data.sentiment);
                } else {
                    setSentimentPreview(null);
                }
            } else {
                setSentimentPreview(null);
            }
        } catch (error) {
            console.log("Sentiment preview failed:", error);
            setSentimentPreview(null);
        } finally {
            setIsAnalyzingSentiment(false);
        }
    }, []);

    const debouncedSentimentAnalysis = useDebounce(analyzeSentimentPreview, 1000);

    const handleCommentChange = (e) => {
        const newComment = e.target.value;
        setComment(newComment);
        
        // Trigger debounced sentiment analysis
        debouncedSentimentAnalysis(newComment, rating);
    };

    const handleRatingChange = (newRating) => {
        setRating(newRating);
        
        // Re-analyze sentiment with new rating if comment exists
        if (comment.trim().length > 10) {
            debouncedSentimentAnalysis(comment, newRating);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // Submit the review - the backend will handle sentiment analysis
            const reviewData = {
                rating,
                comment: comment.trim()
              };

            const response = await fetch(`${apiUrl}/products/${productId}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reviewData),
                credentials: "include"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to submit review");
            }

            const data = await response.json();
            
            // Call the callback with the complete review data
            if (onReviewSubmit) {
                onReviewSubmit(data);
            }
            
            // Reset form
            setRating(0);
            setComment("");
            setError("");
            setSentimentPreview(null);
            
            // Show success message
            alert("Review submitted successfully!");
            
        } catch (error) {
            console.error("Review submission error:", error);
            setError(error.message || "Failed to submit review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSentimentColor = (label) => {
        switch (label?.toLowerCase()) {
            case 'highly positive': return '#22c55e';
            case 'positive': return '#84cc16';
            case 'neutral': return '#6b7280';
            case 'negative': return '#f59e0b';
            case 'highly negative': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getSentimentEmoji = (label) => {
        switch (label?.toLowerCase()) {
            case 'highly positive': return '😍';
            case 'positive': return '😊';
            case 'neutral': return '😐';
            case 'negative': return '😞';
            case 'highly negative': return '😡';
            default: return '😐';
        }
    };

    const getSentimentDescription = (label, score) => {
        const descriptions = {
            'highly positive': 'Very positive sentiment',
            'positive': 'Positive sentiment',
            'neutral': 'Neutral sentiment',
            'negative': 'Negative sentiment',
            'highly negative': 'Very negative sentiment'
        };
        
        const description = descriptions[label?.toLowerCase()] || 'Neutral sentiment';
        const scoreText = score ? ` (${score.toFixed(1)}/10)` : '';
        
        return description + scoreText;
    };

    return (
        <div className="review-form-container">
            <form className="review-form" onSubmit={handleSubmit}>
                <h3>Write a Review</h3>
                
                <div className="rating-input">
                    <label>Your Rating:</label>
                    <div className="stars-container">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                type="button"
                                key={num}
                                className={`star ${rating >= num ? "active" : ""}`}
                                onClick={() => handleRatingChange(num)}
                                disabled={isSubmitting}
                                aria-label={`Rate ${num} star${num > 1 ? 's' : ''}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <div className="selected-rating">
                            <span>Selected rating: </span>
                            <RatingStars rating={rating} />
                            <span className="rating-text">
                                {rating === 1 && "Poor"}
                                {rating === 2 && "Fair"}
                                {rating === 3 && "Good"}
                                {rating === 4 && "Very Good"}
                                {rating === 5 && "Excellent"}
                            </span>
                        </div>
                    )}
                </div>

                <div className="comment-input">
                    <label htmlFor="comment">Your Review:</label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={handleCommentChange}
                        placeholder="Share your experience with this product... (optional)"
                        rows="4"
                        disabled={isSubmitting}
                        maxLength={1000}
                    />
                    <div className="character-count">
                        {comment.length}/1000 characters
                    </div>
                    
                    {/* Sentiment Preview */}
                    {(sentimentPreview || isAnalyzingSentiment) && (
                        <div className="sentiment-preview">
                            {isAnalyzingSentiment ? (
                                <div className="sentiment-analyzing">
                                    <div className="spinner-small"></div>
                                    <span>Analyzing sentiment...</span>
                                </div>
                            ) : sentimentPreview && (
                                <div className="sentiment-indicator">
                                    <div 
                                        className="sentiment-info"
                                        style={{ 
                                            color: getSentimentColor(sentimentPreview.sentiment_label),
                                            borderColor: getSentimentColor(sentimentPreview.sentiment_label)
                                        }}
                                    >
                                        <span className="sentiment-emoji">
                                            {getSentimentEmoji(sentimentPreview.sentiment_label)}
                                        </span>
                                        <div className="sentiment-details">
                                            <div className="sentiment-label">
                                                {getSentimentDescription(
                                                    sentimentPreview.sentiment_label, 
                                                    sentimentPreview.sentiment_score
                                                )}
                                            </div>
                                            {sentimentPreview.confidence && (
                                                <div className="sentiment-confidence">
                                                    Confidence: {Math.round(sentimentPreview.confidence * 100)}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="error-message" role="alert">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    disabled={isSubmitting || rating === 0}
                    className={`submit-button ${isSubmitting ? "submitting" : ""}`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="spinner-small"></div>
                            Submitting...
                        </>
                    ) : (
                        "Submit Review"
                    )}
                </button>

                {isSubmitting && (
                    <div className="processing-message">
                        <div className="processing-steps">
                            <div className="step">✓ Validating review data</div>
                            <div className="step">⏳ Analyzing sentiment</div>
                            <div className="step">⏳ Saving to database</div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ReviewForm;