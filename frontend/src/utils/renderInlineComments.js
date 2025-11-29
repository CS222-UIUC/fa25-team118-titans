export function renderInlineComments(html, comments) {
    if (!comments || comments.length === 0) return html;
    
    let result = html;
    const sorted = [...comments].sort((a, b) => b.startOffset - a.startOffset);

    for (const c of sorted) {
        result = 
            result.slice(0, c.startOffset) +
            `<span class="comment-highlight" data-comment-id="${c.id}">` +
            result.slice(c.startOffset, c.endOffset) +
            `</span>` +
            result.slice(c.endOffset);
    }
    return result;
}

export function stripInlineCommentSpans(html) {
    return html.replace(/<span class="comment-highlight"[^>]*>/g, "")
             .replace(/<\/span>/g, "");
}