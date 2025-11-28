import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, FileText, Plus, Menu, Sun, Moon, Clock, Code } from 'lucide-react';
import './DocsFrontend.css';
import VersionHistoryModal from './VersionHistoryModal';
import { DOC_TEMPLATES } from './docTemplates';
import FindReplacePanel from './FindReplacePanel';
import EditorStatsBar from './EditorStatsBar';
import DeleteDocumentButton from './DeleteDocumentButton.jsx';


export default function DocsFrontend() {
  const [documents, setDocuments] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [showDocList, setShowDocList] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const [darkMode, setDarkMode] = useState(false);
  const [showSearchTools, setShowSearchTools] = useState(false);
  const [templateSelection, setTemplateSelection] = useState('');
  const [editorSearchTerm, setEditorSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const matchPositionsRef = useRef([]);
  const trimmedSearchTerm = editorSearchTerm.trim();
  const normalizedSearchTerm = trimmedSearchTerm.toLowerCase();
  const hasSearchTerm = normalizedSearchTerm.length > 0;
  const searchTermLength = trimmedSearchTerm.length;

  const extractPlainText = useCallback((html) => {
    if (typeof document === 'undefined') {
      return html ? html.replace(/<[^>]+>/g, ' ') : '';
    }
    const temp = document.createElement('div');
    temp.innerHTML = html || '';
    return temp.textContent || '';
  }, []);

  const updateStatsFromText = useCallback((text = '') => {
    const normalized = text || '';
    const trimmed = normalized.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(normalized.length);
  }, []);

  const updateStatsFromHtml = useCallback((html) => {
    updateStatsFromText(extractPlainText(html));
  }, [extractPlainText, updateStatsFromText]);

  const updateStatsFromEditor = useCallback(() => {
    if (!editorRef.current) return;
    updateStatsFromText(editorRef.current.innerText || '');
  }, [updateStatsFromText]);


  const currentDoc = documents.find(d => d.id === currentDocId);
  const GET_DOCUMENTS = gql`
    query GetDocuments {
      documents {
        id
        title
        content
        lastModified
      }
    }
  `;

  const CREATE_DOCUMENT = gql`
    mutation CreateDocument($title: String!, $content: String) {
      createDocument(title: $title, content: $content) {
        id
        title
        content
        lastModified
      }
    }
  `;

  const UPDATE_DOCUMENT = gql`
    mutation UpdateDocument($id: ID!, $title: String, $content: String) {
      updateDocument(id: $id, title: $title, content: $content) {
        id
        title
        content
        lastModified
      }
    }
  `;


  const { data, refetch } = useQuery(GET_DOCUMENTS, { fetchPolicy: 'network-only' });
  const [createDoc] = useMutation(CREATE_DOCUMENT);
  const [updateDoc] = useMutation(UPDATE_DOCUMENT);


  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);


  const createDocumentApollo = useCallback(async (title, content) => {
    const res = await createDoc({ variables: { title, content } });
    const d = res.data.createDocument;
    return { id: d.id, title: d.title, content: d.content, lastModified: d.lastModified ? new Date(d.lastModified) : new Date() };
  }, [createDoc]);


  const updateDocumentApollo = useCallback(async (id, title, content) => {
    const res = await updateDoc({ variables: { id, title, content } });
    const d = res.data.updateDocument;
    return { id: d.id, title: d.title, content: d.content, lastModified: d.lastModified ? new Date(d.lastModified) : new Date() };
  }, [updateDoc]);


  const handleSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    try {
      const localDoc = currentDoc;
      if (!localDoc) {
        const created = await createDocumentApollo('Untitled Doc', html);
        if (created) {
          setDocuments(prev => [...prev, created]);
          setCurrentDocId(created.id);
          setLastSavedAt(created.lastModified);
          updateStatsFromHtml(created.content || '');
          refetch();
        }
      } else {
        const updated = await updateDocumentApollo(currentDocId, localDoc.title, html);
        if (updated) {
          setDocuments(prev => prev.map(d => d.id === currentDocId ? { ...d, lastModified: updated.lastModified } : d));
          setLastSavedAt(updated.lastModified);
          refetch();
        }
      }
    } catch (err) {
      console.error('Save failed', err);
    } finally {
    }
  }, [createDocumentApollo, currentDoc, currentDocId, refetch, updateDocumentApollo, updateStatsFromHtml]);


  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 1000);
  }, [handleSave]);


  useEffect(() => {
    if (data && data.documents) {
      const docs = data.documents.map(d => ({ id: d.id, title: d.title, content: d.content || '<p></p>', lastModified: d.lastModified ? new Date(d.lastModified) : new Date() }));
      setDocuments(docs);
      if (docs.length > 0) setCurrentDocId(docs[0].id);
    }
  }, [data]);

  useEffect(() => {
    if (currentDoc) {
      updateStatsFromHtml(currentDoc.content || '');
      setLastSavedAt(currentDoc.lastModified || null);
    } else {
      setWordCount(0);
      setCharCount(0);
      setLastSavedAt(null);
    }
  }, [currentDoc, updateStatsFromHtml]);

 // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('redo');
          } else {
            e.preventDefault();
            execCommand('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          execCommand('redo');
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentDocId, execCommand, handleSave]);


 // keep editor HTML in sync when doc changes
  useEffect(() => {
    if (editorRef.current && currentDoc && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.innerHTML = currentDoc.content || '';
    }
  }, [currentDocId, currentDoc]);

  useEffect(() => {
    if (!showHistory) return;
    return () => {
      if (currentDocId) {
        refetch();
      }
    };
  }, [currentDocId, refetch, showHistory]);


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
    const nextIdBase = documents.length ? Math.max(...documents.map(d => Number(d.id))) : 0;
    const newId = nextIdBase + 1;
    const newDoc = {
      id: newId,
      title: 'Untitled Doc',
      content: '<p>text</p>',
      lastModified: new Date()
    };
    setDocuments([...documents, newDoc]);
    setCurrentDocId(newId);
    if (editorRef.current) {
      editorRef.current.innerHTML = newDoc.content;
    }
    updateStatsFromHtml(newDoc.content);
    setLastSavedAt(newDoc.lastModified);
    setShowDocList(false);
  };

  const createDocumentFromTemplate = async (templateId) => {
   const template = DOC_TEMPLATES.find((entry) => entry.id === templateId);
   if (!template) return;
   try {
     const created = await createDocumentApollo(template.title, template.content);
     setDocuments((docs) => [...docs, created]);
     setCurrentDocId(created.id);
     if (editorRef.current) {
       editorRef.current.innerHTML = template.content;
     }
     setShowDocList(false);
     refetch();
   } catch (err) {
     console.error('Failed to create document from template', err);
   } finally {
     setTemplateSelection('');
   }
 };

  const handleTemplateSelection = async (event) => {
    const templateId = event.target.value;
    if (!templateId) return;
    setTemplateSelection(templateId);
    await createDocumentFromTemplate(templateId);
  };


  const switchDocument = async (id) => {
    await handleSave();
    setCurrentDocId(id);
    const newDoc = documents.find(d => d.id === id);
    if (editorRef.current) {
      editorRef.current.innerHTML = newDoc ? newDoc.content || '' : '';
    }
    if (newDoc) {
      updateStatsFromHtml(newDoc.content || '');
      setLastSavedAt(newDoc.lastModified || null);
    } else {
      setWordCount(0);
      setCharCount(0);
      setLastSavedAt(null);
    }
    setShowDocList(false);
  };


  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    setFontSize(size);
    if (editorRef.current) {
      editorRef.current.style.fontSize = size + 'px';
    }
  };

  const applyReplacement = (target, replacement) => {
    const text = target.node.textContent || '';
    target.node.textContent = `${text.slice(0, target.startOffset)}${replacement}${text.slice(target.startOffset + target.length)}`;
  };

  const collectMatches = useCallback(() => {
    if (!editorRef.current || !hasSearchTerm) return [];
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT, null);
    const matches = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent || '';
      if (!text.trim()) continue;
      const haystack = text.toLowerCase();
      let index = 0;
      while (true) {
        const found = haystack.indexOf(normalizedSearchTerm, index);
        if (found === -1) break;
        matches.push({ node, startOffset: found, length: searchTermLength });
        index = found + searchTermLength;
      }
    }

    return matches;
  }, [editorRef, hasSearchTerm, normalizedSearchTerm, searchTermLength]);

  const focusMatch = useCallback((index, matchesParam) => {
    const matches = matchesParam || matchPositionsRef.current;
    if (!editorRef.current || !matches.length || index < 0 || !matches[index]) return;
    const match = matches[index];
    if (!match.node || !match.node.isConnected) return;
    try {
      const range = document.createRange();
      range.setStart(match.node, match.startOffset);
      range.setEnd(match.node, match.startOffset + match.length);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      editorRef.current.focus();
      setCurrentMatchIndex(index);
    } catch (err) {
      console.warn('Unable to focus match', err);
    }
  }, []);

  const refreshMatches = useCallback((options = {}) => {
    const { keepIndex = false, skipFocus = false } = options;
    const matches = collectMatches();

    matchPositionsRef.current = matches;
    setMatchCount(matches.length);

    if (!matches.length) {
      setCurrentMatchIndex(-1);
      return matches;
    }

    const baseIndex = keepIndex
      ? Math.min(currentMatchIndex === -1 ? 0 : currentMatchIndex, matches.length - 1)
      : 0;

    if (skipFocus) {
      if (keepIndex) {
        setCurrentMatchIndex(baseIndex);
      } else {
        setCurrentMatchIndex(-1);
      }
      return matches;
    }

    focusMatch(baseIndex, matches);
    return matches;
  }, [collectMatches, currentMatchIndex, focusMatch]);

  useEffect(() => {
    if (hasSearchTerm) {
      refreshMatches({ skipFocus: true });
    } else {
      matchPositionsRef.current = [];
      setMatchCount(0);
      setCurrentMatchIndex(-1);
    }
  }, [hasSearchTerm, normalizedSearchTerm, currentDocId, refreshMatches]);

  const stepMatch = (direction) => {
    if (!hasSearchTerm) return;
    const matches = matchPositionsRef.current.length ? matchPositionsRef.current : refreshMatches();
    if (!matches.length) return;
    const nextIndex = currentMatchIndex === -1
      ? (direction > 0 ? 0 : matches.length - 1)
      : (currentMatchIndex + direction + matches.length) % matches.length;
    focusMatch(nextIndex, matches);
  };

  const handleFindNext = () => stepMatch(1);

  const handleFindPrevious = () => stepMatch(-1);

  const handleReplaceCurrent = () => {
    if (!editorRef.current || !hasSearchTerm) return;
    const matches = matchPositionsRef.current.length ? matchPositionsRef.current : refreshMatches();
    if (!matches.length) return;
    const targetIndex = currentMatchIndex === -1 ? 0 : currentMatchIndex;
    const match = matches[targetIndex];
    if (!match || !match.node || !match.node.isConnected) {
      refreshMatches({ keepIndex: true });
      return;
    }
    applyReplacement(match, replaceTerm);
    const updated = refreshMatches({ keepIndex: true, skipFocus: true });
    if (updated.length) {
      const nextIndex = Math.min(targetIndex, updated.length - 1);
      focusMatch(nextIndex, updated);
    } else {
      setCurrentMatchIndex(-1);
    }
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || !hasSearchTerm) return;
    const matches = matchPositionsRef.current.length
      ? [...matchPositionsRef.current]
      : [...refreshMatches({ skipFocus: true })];
    if (!matches.length) return;
    matches.reverse().forEach(match => {
      if (match.node && match.node.isConnected) {
        applyReplacement(match, replaceTerm);
      }
    });
    refreshMatches({ skipFocus: true });
  };

  const insertCodeBlock = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const snippet = '<pre class="code-block"><code>// code snippet</code></pre><p><br/></p>';
    document.execCommand('insertHTML', false, snippet);
    debouncedSave();
  };

  const handleInput = () => {
    if (hasSearchTerm) {
      refreshMatches({ keepIndex: true, skipFocus: true });
    }
    updateStatsFromEditor();
    debouncedSave();
  };

 return (
   <div className={`docs-container ${darkMode ? 'dark-mode' : ''}`}>
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
            onClick={() => setShowHistory(true)}
            className="save-btn"
         >
            <Clock style={{ width: "16px", height: "16px" }} />
            History
         </button>

         <button
           onClick={handleSave}
           className="save-btn"
         >
           <Save style={{ width: '16px', height: '16px' }} />
           Save
         </button>
         <button
           onClick={() => setDarkMode(!darkMode)}
           className="theme-toggle-btn"
           title={darkMode ? 'Light Mode' : 'Dark Mode'}
         >
           {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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

        <div className="toolbar-divider" />

        <button
          type="button"
          onClick={insertCodeBlock}
          className="icon-btn"
          title="Insert Code Block"
        >
          <Code />
        </button>

        <div className="toolbar-divider" />
        <button
          type="button"
          onClick={() => setShowSearchTools(prev => !prev)}
          className={`toolbar-btn ${showSearchTools ? 'active' : ''}`}
        >
          Find / Replace
        </button>
       </div>
     </div>

    {showSearchTools && (
      <FindReplacePanel
        editorSearchTerm={editorSearchTerm}
        onSearchTermChange={setEditorSearchTerm}
        replaceTerm={replaceTerm}
        onReplaceTermChange={setReplaceTerm}
        matchCount={matchCount}
        currentMatchIndex={currentMatchIndex}
        onFindPrevious={handleFindPrevious}
        onFindNext={handleFindNext}
        onReplaceCurrent={handleReplaceCurrent}
        onReplaceAll={handleReplaceAll}
      />
    )}


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

           <DeleteDocumentButton
             documentId={currentDocId}
             onDeleted={() => {
               refetch();
               setCurrentDocId(null);
               setShowDocList(false);
               setWordCount(0);
               setCharCount(0);
               setLastSavedAt(null);
               if (editorRef.current) {
                 editorRef.current.innerHTML = '';
               }
             }}
           />

           <div className="template-picker">
             <label htmlFor="template-select">Start from template</label>
             <select
               id="template-select"
               value={templateSelection}
               onChange={handleTemplateSelection}
             >
               <option value="">Select template...</option>
               {DOC_TEMPLATES.map((template) => (
                 <option key={template.id} value={template.id}>
                   {template.name}
                 </option>
               ))}
             </select>
           </div>
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

      {showHistory && (
        <VersionHistoryModal documentId={currentDocId} onClose={() => setShowHistory(false)} />
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
    <EditorStatsBar
      wordCount={wordCount}
      charCount={charCount}
      lastSavedAt={lastSavedAt}
    />
   </div>
 );
}