import React, { useMemo } from 'react';

export default function EditorStatsBar({ wordCount, charCount, lastSavedAt }) {
  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return 'Not saved yet';
    try {
      const date = lastSavedAt instanceof Date ? lastSavedAt : new Date(lastSavedAt);
      return date.toLocaleString();
    } catch (err) {
      return 'Not saved yet';
    }
  }, [lastSavedAt]);

  return (
    <div className="editor-stats-bar">
      <div className="stats-metrics">
        <span className="stats-pill" data-testid="word-count">Words: {wordCount}</span>
        <span className="stats-pill" data-testid="char-count">Characters: {charCount}</span>
      </div>
      <div className="stats-saved" data-testid="last-saved">Last saved: {lastSavedLabel}</div>
    </div>
  );
}
