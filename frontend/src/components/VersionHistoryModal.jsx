import { React } from "react";
import { useQuery, gql } from "@apollo/client";
import { X } from "lucide-react";
import "./VersionHistoryModal.css";


const GET_DOCUMENT_VERSIONS = gql`
  query GetDocumentVersions($documentId: ID!) {
    documentVersions(documentId: $documentId) { id content savedAt }
  }
`;

export default function VersionHistoryModal({ documentId, onClose }) {
  
  const { data, loading, error } = useQuery(GET_DOCUMENT_VERSIONS, {
    variables: { documentId },
    skip: !documentId,
    fetchPolicy: "network-only",
  });

  if (!documentId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Version History</h2>
            <button className="close-btn" onClick={onClose}>
              <X />
            </button>
        </div>

        {loading && <p>Loading versions...</p>}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && data && (
          <div className="version-list">
            {data?.documentVersions?.length > 0 ? (
              data.documentVersions.map((version) => (
                <div key={version.id} className="version-item">
                  <div className="version-meta">
                    <span>{new Date(version.savedAt).toLocaleString()}</span>
                  </div>
                  <div
                    className="version-content"
                    dangerouslySetInnerHTML={{
                      __html:
                        version.content.length > 300 ? version.content.slice(0, 300) + "..." : version.content,
                    }}
                  />
                </div>
              ))
            ) : (
              <p>No versions found for this document.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}