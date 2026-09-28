import React, { useEffect, useState } from "react";
import StarPicker from "./StarPicker";
import { submitRating, fetchRatingSummary, fetchMyRating } from "../api";

export default function RatingPage({ playerId }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error

  const loadSummary = () => {
    fetchRatingSummary()
      .then(setSummary)
      .catch(() => {});
  };

  useEffect(() => {
    loadSummary();
    fetchMyRating(playerId)
      .then((mine) => {
        if (mine) {
          setStars(mine.stars);
          setComment(mine.comment || "");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const handleSubmit = () => {
    if (stars < 1) return;
    setStatus("saving");
    submitRating({ playerId, stars, comment })
      .then((res) => {
        setStatus(res && res.queued ? "queued" : "saved");
        loadSummary();
      })
      .catch(() => setStatus("error"));
  };

  return (
    <div className="sl-page sl-rate-page">
      <h1 className="sl-page__title">Rate SignalLoop</h1>
      <p className="sl-subtitle">
        Enjoying the puzzles? Let us know what you think — your rating
        helps shape future levels and features.
      </p>

      <div className="sl-rate-card">
        <StarPicker value={stars} onChange={setStars} size="lg" />
        <textarea
          className="sl-textarea"
          placeholder="Optional: tell us what you liked or what could be better…"
          value={comment}
          maxLength={500}
          onChange={(e) => setComment(e.target.value)}
        />
        <button className="sl-btn sl-btn--primary" disabled={stars < 1} onClick={handleSubmit}>
          {status === "saving" ? "Submitting…" : "Submit Rating"}
        </button>
        {status === "saved" && <p className="sl-rate-thanks">Thanks for the feedback! 🙌</p>}
        {status === "queued" && (
          <p className="sl-rate-thanks">
            Saved on this device 📴 — it will be sent automatically when you're back online.
          </p>
        )}
        {status === "error" && <p className="sl-status--error">Couldn't submit, try again.</p>}
      </div>

      {summary && (
        <div className="sl-rate-summary">
          <div className="sl-rate-summary__score">{summary.average || "–"} / 5</div>
          <div className="sl-rate-summary__count">
            based on {summary.count} rating{summary.count === 1 ? "" : "s"}
          </div>
          {summary.recent_comments.length > 0 && (
            <ul className="sl-rate-comments">
              {summary.recent_comments.map((c, i) => (
                <li key={i}>
                  <span className="sl-rate-comments__stars">{"★".repeat(c.stars)}</span>{" "}
                  {c.comment}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
