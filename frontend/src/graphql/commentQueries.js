import { gql } from "@apollo/client";

export const GET_COMMENTS = gql`
    query GetComments($documentId: ID!) {
        documentComments(documentId: $documentId) {
            id
            documentId
            content
            startOffset
            endOffset
            createdAt
            updatedAt
        }
    }
`;

export const ADD_COMMENT = gql`
    mutation AddComment($documentId: ID!, $content: String!, $startOffset: Int!, $endOffset: Int!) {
        addComment(documentId: $documentId, content: $content, startOffset: $startOffset, endOffset: $endOffset) {
            id
            documentId
            content
            startOffset
            endOffset
            createdAt
            updatedAt
        }
    }
`;

export const DELETE_COMMENT = gql`
    mutation DeleteComment($id: ID!) {
        deleteComment(id: $id)
    }
`;