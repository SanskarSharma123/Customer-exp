import React, { useState } from "react";
import { apiUrl } from "../config/config";
import RatingStars from "./RatingStars";

const ReviewForm = ({ productId, onReviewSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/products/${productId}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ rating, comment }),
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Failed to submit review");
            }

            const data = await response.json();
            onReviewSubmit(data);
            setRating(0);
            setComment("");
            setError("");
        } catch (error) {
            console.error("Review submission error:", error);
            setError(error.message);
        }
    };

    return (
        <form className="review-form" onSubmit={handleSubmit}>
            <h3>Write a Review</h3>
            <div className="rating-input">
                {[1, 2, 3, 4, 5].map((num) => (
                    <button
                        type="button"
                        key={num}
                        className={`star ${rating >= num ? "active" : ""}`}
                        onClick={() => setRating(num)}
                    >
                        ★
                    </button>
                ))}
            </div>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review..."
                rows="4"
            />
            {error && <div className="error">{error}</div>}
            <button type="submit">Submit Review</button>
        </form>
    );
};

export default ReviewForm;