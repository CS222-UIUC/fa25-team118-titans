import React, { useState, useRef, useEffect } from 'react';
import { History, X, Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

export default function VersionHistoryViewer() {
    const [versions, setVersions] = useState([
        { 
          id: 1, 
          content: '<p>Respecting actives in this organization is extremely important because of how much time and effort they put into us.</p>', 
          timestamp: new Date('2024-01-15T10:00:00'), 
          author: 'You' 
        },
        { 
          id: 2, 
          content: '<p>Respecting actives in this organization is extremely important because of how much time and effort they put into us. Their work is what leads to my success in AKPsi because they have built everything which I now benefit from in this organization.</p>', 
          timestamp: new Date('2024-01-15T10:15:00'), 
          author: 'You' 
        },
        { 
          id: 3, 
          content: '<p>Respecting actives in this organization is extremely important because of how much time and effort they put into us. Their work is what leads to my success in AKPsi because they have built everything which I now benefit from in this organization. Without their time investment, my pledge semester would be one of stagnancy, not of growth.</p>', 
          timestamp: new Date('2024-01-15T10:30:00'), 
          author: 'You' 
        },
        { 
          id: 4, 
          content: '<p>Respecting actives in this organization is extremely important because of how much time and effort they put into us. Their work is what leads to my success in AKPsi because they have built everything which I now benefit from in this organization. Without their time investment, my pledge semester would be one of stagnancy, not of growth. They have gone through the entire process I am going through now, and they know what it means to succeed.</p>', 
          timestamp: new Date('2024-01-15T11:00:00'), 
          author: 'You' 
        },
        { 
          id: 5, 
          content: '<p>Respecting actives in this organization is extremely important because of how much time and effort they put into us. Their work is what leads to my success in AKPsi because they have built everything which I now benefit from in this organization. Without their time investment, my pledge semester would be one of stagnancy, not of growth. They have gone through the entire process I am going through now, and they know what it means to succeed. Showing them respect is not just a simple thing, it is not just about following rules or trying to make myself look good.</p>', 
          timestamp: new Date('2024-01-15T11:30:00'), 
          author: 'You' 
        },
        { 
          id: 6, 
          content: '<p>Respecting actives in this organization is extremely important because of how much time and effort they put into us. Their work is what leads to my success in AKPsi because they have built everything which I now benefit from in this organization. Without their time investment, my pledge semester would be one of stagnancy, not of growth. They have gone through the entire process I am going through now, and they know what it means to succeed. Showing them respect is not just a simple thing, it is not just about following rules or trying to make myself look good. Showing them respect is recognizing how hard they have worked to earn their positions in this organization and how much I have to learn from them in order to succeed.</p>', 
          timestamp: new Date('2024-01-15T12:00:00'), 
          author: 'You' 
        },
        { 
          id: 7, 
          content: '<p>Respecting actives in this organization is extremely important because of how much time and effort they put into us. Their work is what leads to my success in AKPsi because they have built everything which I now benefit from in this organization. Without their time investment, my pledge semester would be one of stagnancy, not of growth. They have gone through the entire process I am going through now, and they know what it means to succeed. Showing them respect is not just a simple thing, it is not just about following rules or trying to make myself look good. Showing them respect is recognizing how hard they have worked to earn their positions in this organization and how much I have to learn from them in order to succeed. The actives shape AKPsi into what it is, and it is extremely important to respect those who are directly responsible for your success.</p>', 
          timestamp: new Date('2024-01-15T12:30:00'), 
          author: 'You' 
        },
        { 
          id: 8, 
          content: '<p>Respecting actives in this organization is extremely important because of how much time and effort they put into us. Their work is what leads to my success in AKPsi because they have built everything which I now benefit from in this organization. Without their time investment, my pledge semester would be one of stagnancy, not of growth. They have gone through the entire process I am going through now, and they know what it means to succeed. Showing them respect is not just a simple thing, it is not just about following rules or trying to make myself look good. Showing them respect is recognizing how hard they have worked to earn their positions in this organization and how much I have to learn from them in order to succeed. The actives shape AKPsi into what it is, and it is extremely important to respect those who are directly responsible for your success. Disrespecting them means disrespecting the very foundation and values of this organization that I have sought to incorporate into my daily life because they are the ones who define that foundation.</p>', 
          timestamp: new Date('2024-01-15T13:00:00'), 
          author: 'You' 
        },
    ]);
  
  const [currentVersionIndex, setCurrentVersionIndex] = useState(versions.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrubberRef = useRef(null);
  const playIntervalRef = useRef(null);

  const currentVersion = versions[currentVersionIndex];

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
      }, 1500); // Change version every 1.5 seconds
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
  }, [isPlaying, versions.length]);

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

  const restoreVersion = () => {
    alert(`Restored version ${currentVersion.id} from ${currentVersion.timestamp.toLocaleString()}`);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-blue-500" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Version History</h1>
              <p className="text-sm text-gray-500">Document Title.docx</p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 min-h-[600px]">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: currentVersion.content }}
              />
            </div>
          </div>
        </div>
        {showHistory && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="font-semibold text-gray-900 mb-4">All Versions</h2>
              <div className="space-y-2">
                {versions.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => {
                      setCurrentVersionIndex(index);
                      setIsPlaying(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      index === currentVersionIndex
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      Version {version.id}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(version.timestamp)} at {formatTime(version.timestamp)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {version.author}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">
                Version {currentVersion.id} of {versions.length}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(currentVersion.timestamp)} at {formatTime(currentVersion.timestamp)}
              </span>
              <span className="text-sm text-gray-400">
                by {currentVersion.author}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showHistory ? 'Hide' : 'Show'} all versions
              </button>
              <button
                onClick={restoreVersion}
                className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restore this version
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={currentVersionIndex === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous version"
              >
                <SkipBack className="w-5 h-5 text-gray-700" />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-gray-700" />
                ) : (
                  <Play className="w-5 h-5 text-gray-700" />
                )}
              </button>
              
              <button
                onClick={goToNext}
                disabled={currentVersionIndex === versions.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next version"
              >
                <SkipForward className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="flex-1 relative">
              <div
                ref={scrubberRef}
                onMouseDown={handleMouseDown}
                className="h-2 bg-gray-200 rounded-full cursor-pointer relative group"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(currentVersionIndex / (versions.length - 1)) * 100}%` }}
                />
                
                {versions.map((_, index) => (
                  <div
                    key={index}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-gray-300 rounded-full"
                    style={{ left: `${(index / (versions.length - 1)) * 100}%`, marginLeft: '-4px' }}
                  />
                ))}
                
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform group-hover:scale-125"
                  style={{ left: `${(currentVersionIndex / (versions.length - 1)) * 100}%`, marginLeft: '-8px' }}
                />
              </div>
                
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{formatTime(versions[0].timestamp)}</span>
                <span>{formatTime(versions[versions.length - 1].timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}