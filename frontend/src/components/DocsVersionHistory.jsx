import "./DocsFrontend.css";
import React, { useState, useRef, useEffect } from 'react';
import { History, X, Play, Pause, SkipBack, SkipForward, RotateCcw, Clock, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, gql } from '@apollo/client';

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
      i
      content
      title
      lastModified
    }
  }
`;

export default function VersionHistoryModal({ documentId, onClose, onRestore }) {
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1500);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState(null);
  const scrubberRef = useRef(null);
  const playIntervalRef = useRef(null);
  const editorRef = useRef(null);

  const { data, loading, error } = useQuery(GET_DOCUMENT_VERSIONS, {
    variables: { documentId },
    skip: !documentId,
    fetchPolicy: 'network-only',
  });

  const [restoreVersionMutation] = useMutation(RESTORE_DOCUMENT_VERSION);

  const versions = data?.documentVersions || [];

  useEffect(() => {
    if (versions.length > 0) {
      setCurrentVersionIndex(versions.length - 1);
    }
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
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, versions.length, playbackSpeed]);

  const handleScrubberClick = (e) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newIndex = Math.round(percentage * (versions.length - 1));
    setCurrentVersionIndex(Math.max(0, Math.min(versions.length - 1, newIndex)));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleScrubberClick(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleScrubberClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        toggleCompareMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentVersionIndex, versions.length, isPlaying, compareMode]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const goToPrevious = () => {
    setCurrentVersionIndex(prev => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const goToNext = () => {
    setCurrentVersionIndex(prev => Math.min(versions.length - 1, prev + 1));
    setIsPlaying(false);
  };

  const restoreVersion = async () => {
    if (!currentVersion) return;
    
    try {
      await restoreVersionMutation({
        variables: { documentId, versionId: currentVersion.id }
      });
      
      if (onRestore) {
        onRestore(currentVersion.content);
      }
      
      alert('Document restored successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to restore version:', err);
      alert('Failed to restore version.');
    }
  };

  const toggleCompareMode = () => {
    if (!compareMode && currentVersionIndex > 0) {
      setCompareIndex(currentVersionIndex - 1);
    }
    setCompareMode(!compareMode);
  };

  const jumpToVersion = (index) => {
    setCurrentVersionIndex(index);
    setIsPlaying(false);
  };

  const getWordCount = (html) => {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(word => word.length > 0).length;
  };

  const getCharCount = (html) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.length;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">Loading version history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!versions.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-semibold mb-4">No Version History</h2>
          <p className="text-gray-600 mb-6">This document doesn't have any saved versions yet.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <History className="w-6 h-6 text-blue-500" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Version History</h1>
              <p className="text-sm text-gray-500">
                {versions.length} version{versions.length !== 1 ? 's' : ''} • {formatRelativeTime(currentVersion?.savedAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">{getWordCount(currentVersion?.content || '')} words</span>
            </div>
            
            <button
              onClick={toggleCompareMode}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                compareMode 
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Compare Versions
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className={`max-w-${compareMode ? '7xl' : '3xl'} mx-auto`}>
            <div className={`flex gap-6 ${compareMode ? '' : 'justify-center'}`}>
              <div className={`bg-white rounded-lg shadow-sm border-2 ${compareMode ? 'border-blue-500 flex-1' : 'border-gray-200'} p-12 min-h-[600px]`}>
                {compareMode && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-900">Current Version {currentVersionIndex + 1}</h3>
                    <p className="text-sm text-gray-500">{formatDate(currentVersion.savedAt)} at {formatTime(currentVersion.savedAt)}</p>
                  </div>
                )}
                <div 
                  ref={editorRef}
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentVersion?.content || '' }}
                />
              </div>

              {compareMode && compareVersion && (
                <div className="bg-white rounded-lg shadow-sm border-2 border-orange-500 p-12 min-h-[600px] flex-1">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-900">Version {compareIndex + 1}</h3>
                    <p className="text-sm text-gray-500">{formatDate(compareVersion.savedAt)} at {formatTime(compareVersion.savedAt)}</p>
                  </div>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: compareVersion.content }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {showHistory && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">All Versions</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {versions.map((version, index) => {
                  const wordCount = getWordCount(version.content);
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
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                          : isComparing
                          ? 'bg-orange-50 border-2 border-orange-500'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-medium text-sm text-gray-900">
                          Version {index + 1}
                        </div>
                        {isSelected && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Current</span>
                        )}
                        {isComparing && !isSelected && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">Compare</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(version.savedAt)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {wordCount} words • {getCharCount(version.content)} chars
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">
                Version {currentVersionIndex + 1} of {versions.length}
              </span>
              {currentVersion && (
                <span className="text-sm text-gray-500">
                  {formatDate(currentVersion.savedAt)} at {formatTime(currentVersion.savedAt)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <ChevronDown className="w-4 h-4" />
                  Show all versions
                </button>
              )}
              <button
                onClick={restoreVersion}
                className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Restore this version
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <button
                onClick={goToPrevious}
                disabled={currentVersionIndex === 0}
                className="p-2 rounded-md hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Previous version (←)"
              >
                <SkipBack className="w-5 h-5 text-gray-700" />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="p-2 rounded-md hover:bg-white transition-all bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={goToNext}
                disabled={currentVersionIndex === versions.length - 1}
                className="p-2 rounded-md hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Next version (→)"
              >
                <SkipForward className="w-5 h-5 text-gray-700" />
              </button>

              <div className="border-l border-gray-300 pl-2 ml-1">
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="text-sm bg-transparent border-none focus:outline-none cursor-pointer text-gray-700"
                  title="Playback speed"
                >
                  <option value={3000}>0.5x</option>
                  <option value={1500}>1x</option>
                  <option value={750}>2x</option>
                  <option value={375}>4x</option>
                </select>
              </div>
            </div>

            <div className="flex-1 relative">
              <div
                ref={scrubberRef}
                onMouseDown={handleMouseDown}
                className="h-3 bg-gray-200 rounded-full cursor-pointer relative group shadow-inner"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all shadow-sm"
                  style={{ width: `${versions.length > 1 ? (currentVersionIndex / (versions.length - 1)) * 100 : 0}%` }}
                />
                
                {versions.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => jumpToVersion(index)}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-gray-400 rounded-full hover:scale-150 transition-transform cursor-pointer"
                    style={{ 
                      left: versions.length > 1 ? `${(index / (versions.length - 1)) * 100}%` : '0%', 
                      marginLeft: '-4px' 
                    }}
                    title={`Version ${index + 1}`}
                  />
                ))}
                
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-3 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform group-hover:scale-125"
                  style={{ 
                    left: versions.length > 1 ? `${(currentVersionIndex / (versions.length - 1)) * 100}%` : '0%', 
                    marginLeft: '-10px' 
                  }}
                />
              </div>
                
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{versions[0] && formatTime(versions[0].savedAt)}</span>
                <span className="text-gray-400">Drag or click timeline to scrub</span>
                <span>{versions[versions.length - 1] && formatTime(versions[versions.length - 1].savedAt)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-400 text-center">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">←</kbd> Previous • 
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded ml-1">→</kbd> Next • 
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded ml-1">Space</kbd> Play/Pause • 
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded ml-1">Ctrl+C</kbd> Compare • 
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded ml-1">Esc</kbd> Close
          </div>
        </div>
      </div>
    </div>
  );
}