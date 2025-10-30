import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, gql, useLazyQuery } from '@apollo/client';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, FileText, Plus, Menu } from 'lucide-react';
import './DocsFrontend.css';

export default function DocsFrontend() {
  const [documents, setDocuments] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [showDocList, setShowDocList] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const editorRef = useRef(null);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentDoc = documents.find(d => d.id === currentDocId);
  const GET_DOCUMENTS = gql`
    query GetDocuments {
      documents { id title content lastModified }
    }
  `;

  const SEARCH_DOCUMENTS = gql`
    query SearchDocuments($keyword: String!) {
      searchDocuments(keyword: $keyword) { id title content lastModified }
    }
  `;

  // next step (if interested): adding query into react below
  const RECENT_DOCUMENTS = gql`
    query RecentDocuments($limit: Int) {
      recentDocuments(limit: $limit) { id title content lastModified }
    }
  `;

  const CREATE_DOCUMENT = gql`
    mutation CreateDocument($title: String!, $content: String) {
      createDocument(title: $title, content: $content) { id title content lastModified }
    }
  `;

  const UPDATE_DOCUMENT = gql`
    mutation UpdateDocument($id: ID!, $title: String, $content: String) {
      updateDocument(id: $id, title: $title, content: $content) { id title content lastModified }
    }
  `;

  const { data, loading, error, refetch } = useQuery(GET_DOCUMENTS, { fetchPolicy: 'network-only' });
  const [searchDocuments, { data: searchData, loading: searchLoading }] = useLazyQuery(SEARCH_DOCUMENTS);
  const [createDoc] = useMutation(CREATE_DOCUMENT);
  const [updateDoc] = useMutation(UPDATE_DOCUMENT);

  useEffect(() => {
    if (data && data.documents) {
      const docs = data.documents.map(d => ({ id: d.id, title: d.title, content: d.content || '<p></p>', lastModified: d.lastModified ? new Date(d.lastModified) : new Date() }));
      setDocuments(docs);
      if (docs.length > 0) setCurrentDocId(docs[0].id);
    }
  }, [data]);

  useEffect(() => {
    if (error) console.error('Error loading documents', error);
  }, [error]);

  // keep editor HTML in sync when doc changes
  useEffect(() => {
    if (editorRef.current && currentDoc) {
      editorRef.current.innerHTML = currentDoc.content || '';
    }
  }, [currentDocId, currentDoc]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };


  const createDocumentApollo = async (title, content) => {
    const res = await createDoc({ variables: { title, content } });
    const d = res.data.createDocument;
    return { id: d.id, title: d.title, content: d.content, lastModified: d.lastModified ? new Date(d.lastModified) : new Date() };
  };

  const updateDocumentApollo = async (id, title, content) => {
    const res = await updateDoc({ variables: { id, title, content } });
    const d = res.data.updateDocument;
    return { id: d.id, title: d.title, content: d.content, lastModified: d.lastModified ? new Date(d.lastModified) : new Date() };
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setSaving(true);
    try {
      const localDoc = documents.find(d => String(d.id) === String(currentDocId));
      if (!localDoc) {

        const created = await createDocumentApollo('Untitled Doc', html);
        if (created) {
          setDocuments(docs => [...docs, created]);
          setCurrentDocId(created.id);

          refetch();
        }
      } else {
        const updated = await updateDocumentApollo(currentDocId, localDoc.title, html);
        if (updated) {
          // Only update lastModified, not content, to avoid interfering with active editing
          setDocuments(docs => docs.map(d => d.id === currentDocId ? { ...d, lastModified: updated.lastModified } : d));
          refetch();
        }
      }
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
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
    // Debounce the save to avoid interfering with typing
    if (handleInput.timeout) {
      clearTimeout(handleInput.timeout);
    }
    handleInput.timeout = setTimeout(() => {
      handleSave();
    }, 1000); // Save after 1 second of no typing
  };

  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    setFontSize(size);
    if (editorRef.current) {
      editorRef.current.style.fontSize = size + 'px';
    }
  };

  // next step: use the handleSearch to filter out documents by searched keyword
  const handleSearch = async (keyword) => {
    if (!keyword.trim()) return;

    try {
      const res = await searchDocuments({ variables: { keyword } });
      if (res.data?.searchDocuments) {
        const docs = res.data.searchDocuments.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content || '<p></p>',
          lastModified: d.lastModified ? new Date(d.lastModified) : new Date(),
        }));
        setDocuments(docs);
        if (docs.length > 0) setCurrentDocId(docs[0].id);
      }
    } catch (err) {
      console.error("Search failed", err);
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
            <Save style={{ width: '16px', height: '16px' }} />
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