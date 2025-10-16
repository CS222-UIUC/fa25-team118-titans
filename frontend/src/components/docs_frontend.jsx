import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Save, FileText, Plus, Menu } from 'lucide-react';

export default function docs_frontend() {
  const [documents, setDocuments] = useState([
    { id: 1, title: 'Untitled Document', content: '<p>Start typing...</p>', lastModified: new Date() }
  ]);
  const [currentDocId, setCurrentDocId] = useState(1);
  const [showDocList, setShowDocList] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const editorRef = useRef(null);

  const currentDoc = documents.find(d => d.id === currentDocId);

  useEffect(() => {
    if (editorRef.current && currentDoc) {
      editorRef.current.innerHTML = currentDoc.content;
    }
  }, [currentDocId]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = () => {
    if (editorRef.current) {
      setDocuments(docs =>
        docs.map(d =>
          d.id === currentDocId
            ? { ...d, content: editorRef.current.innerHTML, lastModified: new Date() }
            : d
        )
      );
    }
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
    const newId = Math.max(...documents.map(d => d.id)) + 1;
    const newDoc = {
      id: newId,
      title: 'Untitled Document',
      content: '<p>Start typing...</p>',
      lastModified: new Date()
    };
    setDocuments([...documents, newDoc]);
    setCurrentDocId(newId);
    setShowDocList(false);
  };

  const switchDocument = (id) => {
    handleSave();
    setCurrentDocId(id);
    setShowDocList(false);
  };

  const handleInput = () => {
    handleSave();
  };

  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    setFontSize(size);
    execCommand('fontSize', '7');
    const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
    fontElements?.forEach(el => {
      el.removeAttribute('size');
      el.style.fontSize = size + 'px';
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDocList(!showDocList)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Menu className="w-5 h-5" />
          </button>
          <FileText className="w-6 h-6 text-blue-600" />
          <input
            type="text"
            value={currentDoc?.title || ''}
            onChange={handleTitleChange}
            className="text-lg font-normal border-none outline-none focus:outline-none px-2 py-1 hover:border hover:border-gray-300 rounded"
          />
          <button
            onClick={handleSave}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => execCommand('undo')}
            className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm"
          >
            Undo
          </button>
          <button
            onClick={() => execCommand('redo')}
            className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm"
          >
            Redo
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <select
            onChange={handleFontSizeChange}
            value={fontSize}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="24">24</option>
            <option value="32">32</option>
          </select>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <button
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('underline')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <button
            onClick={() => execCommand('justifyLeft')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('justifyCenter')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('justifyRight')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

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

      {/* Document List Sidebar */}
      {showDocList && (
        <div className="absolute left-0 top-24 w-64 bg-white border-r border-gray-200 shadow-lg z-10 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="p-4">
            <button
              onClick={createNewDocument}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
            <div className="space-y-2">
              {documents.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => switchDocument(doc.id)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    doc.id === currentDocId ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="font-medium text-sm">{doc.title}</div>
                  <div className="text-xs text-gray-500">
                    {doc.lastModified.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg min-h-full">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="p-16 outline-none min-h-full"
            style={{ fontSize: fontSize + 'px' }}
            suppressContentEditableWarning
          />
        </div>
      </div>
    </div>
  );
}