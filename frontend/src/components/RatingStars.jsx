import React from "react";
import "../css/RatingStars.css";

const RatingStars = ({ rating }) => {
    let safeRating = Number(rating);
    if (isNaN(safeRating) || safeRating < 0) safeRating = 0;
    if (safeRating > 5) safeRating = 5;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="rating-stars">
            {[...Array(fullStars)].map((_, i) => (
                <span key={`full-${i}`} className="star full">★</span>
            ))}
            {hasHalfStar && <span className="star half">★</span>}
            {[...Array(emptyStars)].map((_, i) => (
                <span key={`empty-${i}`} className="star">☆</span>
            ))}
        </div>
    );
};

export default RatingStars;