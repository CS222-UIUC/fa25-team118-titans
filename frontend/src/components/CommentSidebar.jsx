import React from "react";
import "./CommentSidebar.css";

export default function CommentSidebar({ comments, onSelectComment, onDelete }) {
    return (
        <div className="comment-sidebar">
            <h3>Comments</h3>
            {comments.length === 0 && (
                <div className="empty-comments">No comments yet.</div>
            )}
            {comments.map(comment => (
                <div key={comment.id} className="comment-card" onClick={() => onSelectComment(comment)}>
                    <div className="comment-text">{comment.content}</div>
                    <button className="delete-comment" onClick={(e) => {e.stopPropagation(); onDelete(comment.id);}}>Delete</button>
                </div>
            ))}
        </div>
    );
}