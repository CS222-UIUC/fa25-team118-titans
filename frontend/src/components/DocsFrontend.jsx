import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, FileText, Plus, Menu, Sun, Moon, Clock } from 'lucide-react';
import './DocsFrontend.css';
import VersionHistoryModal from "./VersionHistoryModal";


export default function DocsFrontend() {
  const [documents, setDocuments] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [showDocList, setShowDocList] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const [darkMode, setDarkMode] = useState(false);
  const [showSearchTools, setShowSearchTools] = useState(false);
  const [editorSearchTerm, setEditorSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const matchPositionsRef = useRef([]);
  const trimmedSearchTerm = editorSearchTerm.trim();
  const normalizedSearchTerm = trimmedSearchTerm.toLowerCase();
  const hasSearchTerm = normalizedSearchTerm.length > 0;
  const searchTermLength = trimmedSearchTerm.length;
  const debouncedSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 1000);
  };


  const currentDoc = documents.find(d => d.id === currentDocId);
  const GET_DOCUMENTS = gql`
    query GetDocuments {
      documents { id title content lastModified }
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


 const { data, refetch } = useQuery(GET_DOCUMENTS, { fetchPolicy: 'network-only' });
 const [createDoc] = useMutation(CREATE_DOCUMENT);
 const [updateDoc] = useMutation(UPDATE_DOCUMENT);


 useEffect(() => {
   if (data && data.documents) {
     const docs = data.documents.map(d => ({ id: d.id, title: d.title, content: d.content || '<p></p>', lastModified: d.lastModified ? new Date(d.lastModified) : new Date() }));
     setDocuments(docs);
     if (docs.length > 0) setCurrentDocId(docs[0].id);
   }
 }, [data]);

 // Keyboard shortcuts handler
 useEffect(() => {
  const handleKeyDown = (e) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;
    switch(e.key.toLowerCase()) {
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
}, [currentDocId]);


 // keep editor HTML in sync when doc changes
 useEffect(() => {
   if (editorRef.current && currentDoc && !editorRef.current.contains(document.activeElement)) {
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
   if (saveTimeoutRef.current) {
     clearTimeout(saveTimeoutRef.current);
     saveTimeoutRef.current = null;
   }
   if (!editorRef.current) return;
   const html = editorRef.current.innerHTML;
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
         setDocuments(docs => docs.map(d => d.id === currentDocId ? { ...d, lastModified: updated.lastModified } : d));
         refetch();
       }
     }
   } catch (err) {
     console.error('Save failed', err);
   } finally {
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
   if (editorRef.current) {
     editorRef.current.innerHTML = newDoc.content;
   }
   setShowDocList(false);
 };


 const switchDocument = async (id) => {
   await handleSave();
   setCurrentDocId(id);
   if (editorRef.current) {
     const newDoc = documents.find(d => d.id === id);
     editorRef.current.innerHTML = newDoc ? newDoc.content || '' : '';
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

 const handleInput = () => {
   if (hasSearchTerm) {
     refreshMatches({ keepIndex: true, skipFocus: true });
   }
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
          onClick={() => setShowSearchTools(prev => !prev)}
          className={`toolbar-btn ${showSearchTools ? 'active' : ''}`}
        >
          Find / Replace
        </button>
       </div>
     </div>

    {showSearchTools && (
      <div className="search-panel">
        <div className="search-row">
          <div className="search-group">
            <label htmlFor="doc-search-term">Find</label>
            <input
              id="doc-search-term"
              type="text"
              value={editorSearchTerm}
              placeholder="Search within document"
              onChange={(e) => setEditorSearchTerm(e.target.value)}
            />
          </div>
          <div className="search-group">
            <label htmlFor="doc-replace-term">Replace</label>
            <input
              id="doc-replace-term"
              type="text"
              value={replaceTerm}
              placeholder="Replacement text"
              onChange={(e) => setReplaceTerm(e.target.value)}
            />
          </div>
          <div className="search-actions">
            <span className="match-count">
              {matchCount ? `${currentMatchIndex >= 0 ? currentMatchIndex + 1 : 0} / ${matchCount}` : '0 matches'}
            </span>
            <button type="button" onClick={handleFindPrevious} disabled={!matchCount}>
              Prev
            </button>
            <button type="button" onClick={handleFindNext} disabled={!matchCount}>
              Next
            </button>
            <button type="button" onClick={handleReplaceCurrent} disabled={!matchCount}>
              Replace
            </button>
            <button type="button" onClick={handleReplaceAll} disabled={!editorSearchTerm.trim()}>
              Replace All
            </button>
          </div>
        </div>
      </div>
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
   </div>
 );
}