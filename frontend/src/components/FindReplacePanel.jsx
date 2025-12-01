import React from 'react';

export default function FindReplacePanel({
  editorSearchTerm,
  onSearchTermChange,
  replaceTerm,
  onReplaceTermChange,
  matchCount,
  currentMatchIndex,
  onFindPrevious,
  onFindNext,
  onReplaceCurrent,
  onReplaceAll,
}) {
  const matchLabel = matchCount
    ? `${currentMatchIndex >= 0 ? currentMatchIndex + 1 : 0} / ${matchCount}`
    : '0 matches';

  const hasSearch = Boolean(editorSearchTerm.trim());

  return (
    <div className="search-panel">
      <div className="search-row">
        <div className="search-group">
          <label htmlFor="doc-search-term">Find</label>
          <input
            id="doc-search-term"
            type="text"
            value={editorSearchTerm}
            placeholder="Search within document"
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
        <div className="search-group">
          <label htmlFor="doc-replace-term">Replace</label>
          <input
            id="doc-replace-term"
            type="text"
            value={replaceTerm}
            placeholder="Replacement text"
            onChange={(e) => onReplaceTermChange(e.target.value)}
          />
        </div>
        <div className="search-actions">
          <span className="match-count">{matchLabel}</span>
          <button type="button" onClick={onFindPrevious} disabled={!matchCount}>
            Prev
          </button>
          <button type="button" onClick={onFindNext} disabled={!matchCount}>
            Next
          </button>
          <button type="button" onClick={onReplaceCurrent} disabled={!matchCount}>
            Replace
          </button>
          <button type="button" onClick={onReplaceAll} disabled={!hasSearch}>
            Replace All
          </button>
        </div>
      </div>
    </div>
  );
}
