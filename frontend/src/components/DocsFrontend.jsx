import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, FileText, Plus, Menu } from 'lucide-react';
import './DocsFrontend.css';

export default function DocsFrontend() {
  const [documents, setDocuments] = useState([
    { id: 1, title: 'Untitled Doc', content: '<p>text</p>', lastModified: new Date() }
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
      title: 'Untitled Doc',
      content: '<p>text</p>',
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
    if (editorRef.current) {
      editorRef.current.style.fontSize = size + 'px';
    }
  };

  return (
    <div className="docs-container">
      <div className="docs-header">
        <div className="header-content">
          <button
            onClick={() => setShowDocList(!showDocList)}
            className="menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          <FileText className="file-icon" />
          <input
            type="text"
            value={currentDoc?.title || ''}
            onChange={handleTitleChange}
            className="doc-title-input"
          />
          <button
            onClick={handleSave}
            className="save-btn"
          >
            <Save style={{width: '16px', height: '16px'}} />
            Save
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-content">
          <button
            onClick={() => execCommand('undo')}
            className="toolbar-btn"
          >
            Undo
          </button>
          <button
            onClick={() => execCommand('redo')}
            className="toolbar-btn"
          >
            Redo
          </button>
          <div className="toolbar-divider" />
          
          <select
            onChange={handleFontSizeChange}
            value={fontSize}
            className="toolbar-select"
          >
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="24">24</option>
            <option value="32">32</option>
          </select>

          <div className="toolbar-divider" />

          <button
            onClick={() => execCommand('bold')}
            className="icon-btn"
            title="Bold"
          >
            <Bold />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="icon-btn"
            title="Italic"
          >
            <Italic />
          </button>
          <button
            onClick={() => execCommand('underline')}
            className="icon-btn"
            title="Underline"
          >
            <Underline />
          </button>

          <div className="toolbar-divider" />

          <button
            onClick={() => execCommand('justifyLeft')}
            className="icon-btn"
            title="Align Left"
          >
            <AlignLeft />
          </button>
          <button
            onClick={() => execCommand('justifyCenter')}
            className="icon-btn"
            title="Align Center"
          >
            <AlignCenter />
          </button>
          <button
            onClick={() => execCommand('justifyRight')}
            className="icon-btn"
            title="Align Right"
          >
            <AlignRight />
          </button>

          <div className="toolbar-divider" />

          <select
            onChange={(e) => execCommand('formatBlock', e.target.value)}
            className="toolbar-select"
            defaultValue="p"
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>
      </div>

      {showDocList && (
        <div className="sidebar">
          <div className="sidebar-content">
            <button
              onClick={createNewDocument}
              className="new-doc-btn"
            >
              <Plus />
              New Document
            </button>
            <div className="doc-list">
              {documents.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => switchDocument(doc.id)}
                  className={doc.id === currentDocId ? 'doc-item active' : 'doc-item'}
                >
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-date">
                    {doc.lastModified.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="editor-container">
        <div className="editor-paper">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="editor-content"
            style={{ fontSize: fontSize + 'px' }}
            suppressContentEditableWarning
          />
        </div>
      </div>
    </div>
  );
}