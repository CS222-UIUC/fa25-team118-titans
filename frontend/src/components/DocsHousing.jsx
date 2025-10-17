import React, { useState, useRef, useEffect } from 'react';
import { FileText, Plus, Grid, List, Clock, Star, Trash2, MoreVertical, Search, Folder, Home, Settings, ArrowLeft, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save } from 'lucide-react';

export default function DocsHousing() {
  const [documents, setDocuments] = useState([
    { id: 1, title: 'Welcome Document', content: '<h1>Welcome!</h1><p>Start typing here...</p>', lastModified: new Date(), starred: false, folder: 'home' },
    { id: 2, title: 'Meeting Notes', content: '<h2>Team Meeting</h2><p>Discussion points...</p>', lastModified: new Date(Date.now() - 86400000), starred: true, folder: 'home' },
    { id: 3, title: 'Project Plan', content: '<h1>Q1 2024 Plan</h1><p>Goals and objectives...</p>', lastModified: new Date(Date.now() - 172800000), starred: false, folder: 'work' }
  ]);
  
  const [currentDocId, setCurrentDocId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState('home');
  const [fontSize, setFontSize] = useState('16');
  const editorRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const currentDoc = documents.find(d => d.id === currentDocId);
  const isEditing = currentDocId !== null;

  useEffect(() => {
    if (editorRef.current && currentDoc) {
      editorRef.current.innerHTML = currentDoc.content || '';
    }
  }, [currentDocId]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = () => {
    if (!editorRef.current || !currentDoc) return;
    
    setSaving(true);
    const html = editorRef.current.innerHTML;
    
    setDocuments(docs =>
      docs.map(d =>
        d.id === currentDocId
          ? { ...d, content: html, lastModified: new Date() }
          : d
      )
    );
    
    setTimeout(() => setSaving(false), 500);
  };

  const handleTitleChange = (e) => {
    setDocuments(docs =>
      docs.map(d =>
        d.id === currentDocId
          ? { ...d, title: e.target.value }
          : d
      )
    );
  };

  const createNewDocument = () => {
    const newId = Math.max(...documents.map(d => d.id), 0) + 1;
    const newDoc = {
      id: newId,
      title: 'Untitled Document',
      content: '<p>Start typing...</p>',
      lastModified: new Date(),
      starred: false,
      folder: currentFolder
    };
    setDocuments([newDoc, ...documents]);
    setCurrentDocId(newId);
  };

  const openDocument = (id) => {
    handleSave();
    setCurrentDocId(id);
  };

  const closeEditor = () => {
    handleSave();
    setCurrentDocId(null);
  };

  const toggleStar = (id, e) => {
    e.stopPropagation();
    setDocuments(docs =>
      docs.map(d =>
        d.id === id ? { ...d, starred: !d.starred } : d
      )
    );
  };

  const deleteDocument = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this document?')) {
      setDocuments(docs => docs.filter(d => d.id !== id));
      if (currentDocId === id) setCurrentDocId(null);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = currentFolder === 'all' || doc.folder === currentFolder;
    return matchesSearch && matchesFolder;
  });

  if (isEditing) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={closeEditor}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <FileText className="w-6 h-6 text-blue-500" />
            <input
              type="text"
              value={currentDoc?.title || ''}
              onChange={handleTitleChange}
              className="flex-1 text-lg font-medium outline-none px-2 py-1 hover:bg-gray-50 rounded"
            />
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => execCommand('undo')} className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm">
              Undo
            </button>
            <button onClick={() => execCommand('redo')} className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm">
              Redo
            </button>
            <div className="w-px h-6 bg-gray-300" />
            
            <select
              onChange={(e) => {
                setFontSize(e.target.value);
                if (editorRef.current) editorRef.current.style.fontSize = e.target.value + 'px';
              }}
              value={fontSize}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="24">24</option>
            </select>

            <div className="w-px h-6 bg-gray-300" />

            <button onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-100 rounded" title="Bold">
              <Bold className="w-4 h-4" />
            </button>
            <button onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-100 rounded" title="Italic">
              <Italic className="w-4 h-4" />
            </button>
            <button onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-100 rounded" title="Underline">
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300" />

            <button onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-100 rounded" title="Align Left">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-100 rounded" title="Align Center">
              <AlignCenter className="w-4 h-4" />
            </button>
            <button onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-100 rounded" title="Align Right">
              <AlignRight className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300" />

            <select
              onChange={(e) => execCommand('formatBlock', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              defaultValue="p"
            >
              <option value="p">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg min-h-full p-16">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleSave}
              className="outline-none min-h-full"
              style={{ fontSize: fontSize + 'px' }}
              suppressContentEditableWarning
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-semibold text-gray-900">Docs</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={createNewDocument}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Document
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentFolder('all')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                currentFolder === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">All Documents</span>
            </button>
            <button
              onClick={() => setCurrentFolder('home')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                currentFolder === 'home' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Folder className="w-5 h-5" />
              <span className="font-medium">Personal</span>
            </button>
            <button
              onClick={() => setCurrentFolder('work')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                currentFolder === 'work' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Folder className="w-5 h-5" />
              <span className="font-medium">Work</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {currentFolder === 'all' ? 'All Documents' : currentFolder === 'home' ? 'Personal' : 'Work'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No documents found</p>
                <button
                  onClick={createNewDocument}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create your first document
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => openDocument(doc.id)}
                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white"
                  >
                    <div className="aspect-[8.5/11] bg-gradient-to-br from-blue-50 to-white p-4 border-b border-gray-200 flex items-start">
                      <div className="w-full h-full bg-white rounded shadow-sm p-2 overflow-hidden">
                        <div className="text-xs text-gray-400 line-clamp-6" dangerouslySetInnerHTML={{ __html: doc.content }} />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate flex-1">{doc.title}</h3>
                        <button
                          onClick={(e) => toggleStar(doc.id, e)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Star className={`w-4 h-4 ${doc.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {doc.lastModified.toLocaleDateString()}
                        </div>
                        <button
                          onClick={(e) => deleteDocument(doc.id, e)}
                          className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => openDocument(doc.id)}
                    className="group flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      <p className="text-sm text-gray-500">Modified {doc.lastModified.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={(e) => toggleStar(doc.id, e)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Star className={`w-5 h-5 ${doc.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={(e) => deleteDocument(doc.id, e)}
                      className="p-2 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}