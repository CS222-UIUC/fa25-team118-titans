import React, { useState, useRef, useEffect } from 'react';
import { History, X, Play, Pause, SkipBack, SkipForward, RotateCcw, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, gql } from '@apollo/client';
import './DocsFrontend.css';

const GET_DOCUMENT_VERSIONS = gql`
  query GetDocumentVersions($documentId: ID!) {
    documentVersions(documentId: $documentId) {
      id
      content
      savedAt
    }
  }
`;

const RESTORE_DOCUMENT_VERSION = gql`
  mutation RestoreDocumentVersion($documentId: ID!, $versionId: ID!) {
    restoreDocumentVersion(documentId: $documentId, versionId: $versionId) {
      id
      content
      title
      lastModified
    }
  }
`;

export default function VersionHistoryModal({ documentId, onClose, onRestore, isDarkMode }) {
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1500);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrubberRef = useRef(null);
  const playIntervalRef = useRef(null);

  const { data, loading, error } = useQuery(GET_DOCUMENT_VERSIONS, {
    variables: { documentId },
    skip: !documentId,
    fetchPolicy: 'network-only',
  });

  const [restoreVersionMutation] = useMutation(RESTORE_DOCUMENT_VERSION);
  const versions = data?.documentVersions || [];

  useEffect(() => {
    if (versions.length > 0) setCurrentVersionIndex(versions.length - 1);
  }, [versions.length]);

  const currentVersion = versions[currentVersionIndex];
  const compareVersion = compareMode && compareIndex !== null ? versions[compareIndex] : null;

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentVersionIndex(prev => {
          if (prev >= versions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [isPlaying, versions.length, playbackSpeed]);

  // Scrubber
  const handleScrubberClick = (e) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newIndex = Math.round(percentage * (versions.length - 1));
    setCurrentVersionIndex(Math.max(0, Math.min(versions.length - 1, newIndex)));
  };

  const handleMouseDown = (e) => { setIsDragging(true); handleScrubberClick(e); };
  const handleMouseMove = (e) => { if (isDragging) handleScrubberClick(e); };
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrevious(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goToNext(); }
      else if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
      else if (e.key === 'Escape') onClose();
      else if (e.key === 'c' && e.ctrlKey) { e.preventDefault(); toggleCompareMode(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentVersionIndex, versions.length, isPlaying, compareMode]);

  const togglePlayPause = () => setIsPlaying(!isPlaying);
  const goToPrevious = () => { setCurrentVersionIndex(prev => Math.max(0, prev - 1)); setIsPlaying(false); };
  const goToNext = () => { setCurrentVersionIndex(prev => Math.min(versions.length - 1, prev + 1)); setIsPlaying(false); };
  const jumpToVersion = (index) => { setCurrentVersionIndex(index); setIsPlaying(false); };
  const toggleCompareMode = () => { 
    if (!compareMode && currentVersionIndex > 0) setCompareIndex(currentVersionIndex - 1); 
    setCompareMode(!compareMode); 
  };

  const restoreVersion = async () => {
    if (!currentVersion) return;
    try {
      await restoreVersionMutation({ variables: { documentId, versionId: currentVersion.id } });
      if (onRestore) onRestore(currentVersion.content);
      alert('Document restored successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to restore version:', err);
      alert('Failed to restore version.');
    }
  };

  const getWordCount = (html) => html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const getCharCount = (html) => html.replace(/<[^>]*>/g, '').length;
  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (timestamp) => new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatRelativeTime = (timestamp) => {
    const now = new Date(), past = new Date(timestamp), diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000), diffHours = Math.floor(diffMs / 3600000), diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading || !versions.length) return (
    <div className={`docs-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <p style={{ padding: '24px' }}>
        {loading ? 'Loading version history...' : 'No version history available.'}
      </p>
    </div>
  );

  if (error) return (
    <div className={`docs-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <p style={{ padding: '24px', color: 'red' }}>Error loading versions: {error.message}</p>
    </div>
  );

  return (
    <div className={`docs-container ${isDarkMode ? 'dark-mode' : ''}`} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="docs-header">
        <div className="header-content">
          <History className="file-icon" />
          <div>
            <h1 className="doc-title" style={{ margin: 0, fontSize: '18px' }}>Version History</h1>
            <p className="doc-date" style={{ margin: 0, fontSize: '13px' }}>
              {versions.length} version{versions.length !== 1 ? 's' : ''} • {formatRelativeTime(currentVersion?.savedAt)}
            </p>
          </div>
        </div>
        <div className="header-content" style={{ gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: '6px', fontSize: '13px' }}>
            <FileText style={{ width: '16px', height: '16px' }} />
            <span>{getWordCount(currentVersion?.content || '')} words</span>
          </div>
          <button onClick={toggleCompareMode} className={`toolbar-btn ${compareMode ? 'active' : ''}`}>
            Compare
          </button>
          <button onClick={onClose} className="menu-btn">
            <X style={{ width: '18px', height: '18px' }} />
            Close
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className="editor-container" style={{ display: 'flex', gap: '16px', flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div className="editor-paper" style={{ 
            flex: 1, 
            minHeight: '500px',
            border: compareMode ? '2px solid #3b82f6' : undefined
          }}>
            {compareMode && (
              <div style={{ 
                padding: '12px', 
                borderBottom: '1px solid #e5e7eb', 
                marginBottom: '12px',
                background: isDarkMode ? '#1f2937' : '#f9fafb'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Version {currentVersionIndex + 1}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  {formatDate(currentVersion.savedAt)} at {formatTime(currentVersion.savedAt)}
                </p>
              </div>
            )}
            <div className="editor-content" dangerouslySetInnerHTML={{ __html: currentVersion?.content || '' }} />
          </div>

          {compareMode && compareVersion && (
            <div className="editor-paper" style={{ 
              flex: 1, 
              minHeight: '500px', 
              border: '2px solid #f59e0b' 
            }}>
              <div style={{ 
                padding: '12px', 
                borderBottom: '1px solid #e5e7eb', 
                marginBottom: '12px',
                background: isDarkMode ? '#1f2937' : '#f9fafb'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Version {compareIndex + 1}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  {formatDate(compareVersion.savedAt)} at {formatTime(compareVersion.savedAt)}
                </p>
              </div>
              <div className="editor-content" dangerouslySetInnerHTML={{ __html: compareVersion.content }} />
            </div>
          )}
        </div>

        {showSidebar && (
          <div style={{ 
            width: '300px', 
            borderLeft: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, 
            overflowY: 'auto',
            background: isDarkMode ? '#1f2937' : '#ffffff',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>All Versions</h2>
              <button onClick={() => setShowSidebar(false)} className="icon-btn">
                <ChevronUp style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {versions.map((version, index) => {
                const wordCount = getWordCount(version.content);
                const charCount = getCharCount(version.content);
                const isSelected = index === currentVersionIndex;
                const isComparing = index === compareIndex;
                
                return (
                  <button
                    key={version.id}
                    onClick={() => {
                      if (compareMode && !isSelected) {
                        setCompareIndex(index);
                      } else {
                        jumpToVersion(index);
                      }
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid #3b82f6' : isComparing ? '2px solid #f59e0b' : '2px solid transparent',
                      background: isSelected ? (isDarkMode ? '#1e3a8a' : '#dbeafe') : isComparing ? (isDarkMode ? '#78350f' : '#fef3c7') : isDarkMode ? '#374151' : '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>Version {index + 1}</div>
                      {isSelected && (
                        <span style={{ fontSize: '11px', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                          Current
                        </span>
                      )}
                      {isComparing && !isSelected && (
                        <span style={{ fontSize: '11px', background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                          Compare
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      {formatRelativeTime(version.savedAt)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      {wordCount} words • {charCount} chars
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        padding: '12px 24px', 
        borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isDarkMode ? '#1f2937' : '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
          <span style={{ fontWeight: 500 }}>
            Version {currentVersionIndex + 1} of {versions.length}
          </span>
          {currentVersion && (
            <>
              <span style={{ color: '#6b7280' }}>
                {formatDate(currentVersion.savedAt)} at {formatTime(currentVersion.savedAt)}
              </span>
              <span style={{ color: '#9ca3af' }}>
                {getWordCount(currentVersion.content)} words • {getCharCount(currentVersion.content)} chars
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!showSidebar && (
            <button onClick={() => setShowSidebar(true)} className="toolbar-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ChevronDown style={{ width: '16px', height: '16px' }} />
              Show all versions
            </button>
          )}
          <button onClick={restoreVersion} className="save-btn">
            <RotateCcw style={{ width: '16px', height: '16px' }} />
            Restore this version
          </button>
        </div>
      </div>

      <div className="docs-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goToPrevious} disabled={currentVersionIndex === 0} className="icon-btn" title="Previous (←)">
            <SkipBack style={{ width: '18px', height: '18px' }} />
          </button>
          <button onClick={togglePlayPause} className="icon-btn" title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
            {isPlaying ? <Pause style={{ width: '18px', height: '18px' }} /> : <Play style={{ width: '18px', height: '18px' }} />}
          </button>
          <button onClick={goToNext} disabled={currentVersionIndex === versions.length - 1} className="icon-btn" title="Next (→)">
            <SkipForward style={{ width: '18px', height: '18px' }} />
          </button>
          <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))} className="toolbar-select" title="Playback speed">
            <option value={3000}>0.5x</option>
            <option value={1500}>1x</option>
            <option value={750}>2x</option>
            <option value={375}>4x</option>
          </select>
        </div>

        <div style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <kbd style={{ padding: '2px 6px', background: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: '3px' }}>←</kbd> Previous •
          <kbd style={{ padding: '2px 6px', background: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: '3px' }}>→</kbd> Next •
          <kbd style={{ padding: '2px 6px', background: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: '3px' }}>Space</kbd> Play •
          <kbd style={{ padding: '2px 6px', background: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: '3px' }}>Ctrl+C</kbd> Compare •
          <kbd style={{ padding: '2px 6px', background: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: '3px' }}>Esc</kbd> Close
        </div>
      </div>

      <div style={{ padding: '12px 24px', background: isDarkMode ? '#1f2937' : '#ffffff' }}>
        <div style={{ position: 'relative' }}>
          <div 
            ref={scrubberRef} 
            onMouseDown={handleMouseDown} 
            className="scrubber" 
            style={{ 
              position: 'relative', 
              height: '8px', 
              background: isDarkMode ? '#374151' : '#d1d5db', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            <div 
              className="scrubber-fill" 
              style={{
                position: 'absolute',
                height: '100%',
                background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                width: `${versions.length > 1 ? (currentVersionIndex / (versions.length - 1)) * 100 : 0}%`,
                borderRadius: '4px',
                transition: isDragging ? 'none' : 'width 0.2s'
              }} 
            />

            <div 
              className="scrubber-thumb" 
              style={{
                position: 'absolute',
                top: '50%',
                left: versions.length > 1 ? `${(currentVersionIndex / (versions.length - 1)) * 100}%` : '0%',
                transform: 'translate(-50%, -50%)',
                width: '16px',
                height: '16px',
                background: '#3b82f6',
                border: '3px solid white',
                borderRadius: '50%',
                cursor: isDragging ? 'grabbing' : 'grab',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: isDragging ? 'none' : 'left 0.2s'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
            <span>{versions[0] && formatTime(versions[0].savedAt)}</span>
            <span style={{ color: '#6b7280' }}>Drag or click timeline to scrub</span>
            <span>{versions[versions.length - 1] && formatTime(versions[versions.length - 1].savedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}