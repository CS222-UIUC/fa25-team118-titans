import React from "react";
import { gql, useMutation } from "@apollo/client";
import { Trash } from "lucide-react";
import "./DeleteDocumentButton.css";

const DELETE_DOCUMENT = gql`
    mutation DeleteDocument($id: ID!) {
        deleteDocument(id: $id)
    }
`;

export default function DeleteDocumentButton({ documentId, onDeleted }) {
    const [deleteDocument, { loading }] = useMutation(DELETE_DOCUMENT);

    const handleDelete = async () => {
        if (!documentId) {
            alert("No document selected.");
            return;
        }

        const confirmed = window.confirm("Are you sure you want to delete this document?");
        if (!confirmed) return;

        try {
            const res = await deleteDocument({ variables: { id: documentId } });

            if (res.data.deleteDocument) {
                alert("Document deleted.");
                onDeleted?.();
            } else {
                alert("Document not found or could not be deleted.");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting document.");
        }
    };

    return (
        <button
            className="delete-doc-button"
            onClick={handleDelete}
            disabled={loading}
        >
            <Trash size={16} />
            {loading ? "Deleting..." : "Delete Selected Document"}
        </button>
    );
}