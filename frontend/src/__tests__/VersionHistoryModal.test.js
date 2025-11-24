import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import VersionHistoryModal from "../components/VersionHistoryModal";
import { createPatchedCache } from "../testUtils/createPatchedCache";

jest.mock("../components/VersionHistoryModal.css", () => ({}));
jest.mock("lucide-react", () => ({
  X: () => <div data-testid="close-icon" />,
}));

const GET_DOCUMENT_VERSIONS = gql`
  query GetDocumentVersions($documentId: ID!) {
    documentVersions(documentId: $documentId) {
      id
      content
      savedAt
    }
  }
`;

const RESTORE_DOCUMENT_VERSION = gql`
  mutation RestoreDocumentVersion($documentId: ID!, $versionId: ID!) {
    restoreDocumentVersion(documentId: $documentId, versionId: $versionId) {
      id
      content
      title
      lastModified
    }
  }
`;

const versionMocks = [
  {
    request: {
      query: GET_DOCUMENT_VERSIONS,
      variables: { documentId: "1" },
    },
    result: {
      data: {
        documentVersions: [
          {
            id: "v1",
            content: "<p>Version 1 content</p>",
            savedAt: "2023-11-11T00:00:00Z",
          },
          {
            id: "v2",
            content: "<p>Version 2 content</p>",
            savedAt: "2023-11-12T00:00:00Z",
          },
        ],
      },
    },
  },
];

const emptyVersionMocks = [
  {
    request: {
      query: GET_DOCUMENT_VERSIONS,
      variables: { documentId: "1" },
    },
    result: {
      data: {
        documentVersions: [],
      },
    },
  },
];

const restoreMocks = [
  ...versionMocks,
  {
    request: {
      query: RESTORE_DOCUMENT_VERSION,
      variables: { documentId: "1", versionId: "v1" },
    },
    result: {
      data: {
        restoreDocumentVersion: {
          id: "1",
          content: "<p>Version 1 content</p>",
          title: "Restored Title",
          lastModified: "2023-11-13T00:00:00Z",
          __typename: "Document",
        },
      },
    },
  },
];

beforeAll(() => {
  window.alert = jest.fn();
});

describe("VersionHistoryModal", () => {
  test("renders loading and version list", async () => {
    render(
      <MockedProvider mocks={versionMocks} cache={createPatchedCache()}>
        <VersionHistoryModal documentId="1" onClose={jest.fn()} />
      </MockedProvider>
    );

    expect(screen.getByText(/Loading versions.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Version 1 content/i)).toBeInTheDocument();
      expect(screen.getByText(/Version 2 content/i)).toBeInTheDocument();
    });
  });

  test("renders 'No versions found' when list is empty", async () => {
    render(
      <MockedProvider mocks={emptyVersionMocks} cache={createPatchedCache()}>
        <VersionHistoryModal documentId="1" onClose={jest.fn()} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No versions found/i)).toBeInTheDocument();
    });
  });

  test("renders nothing if no documentId provided", () => {
    const { container } = render(
      <MockedProvider mocks={versionMocks} cache={createPatchedCache()}>
        <VersionHistoryModal onClose={jest.fn()} />
      </MockedProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  test("clicking restore triggers mutation and closes modal", async () => {
    const mockOnClose = jest.fn();

    render(
      <MockedProvider mocks={restoreMocks} cache={createPatchedCache()}>
        <VersionHistoryModal documentId="1" onClose={mockOnClose} />
      </MockedProvider>
    );

    const restoreButtons = await screen.findAllByText("Restore This Version");
    expect(restoreButtons.length).toBe(2);

    fireEvent.click(restoreButtons[0]);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  test("restore button appears for every version", async () => {
    render(
      <MockedProvider mocks={versionMocks} cache={createPatchedCache()}>
        <VersionHistoryModal documentId="1" onClose={jest.fn()} />
      </MockedProvider>
    );

    await waitFor(() => {
      const restoreButtons = screen.getAllByText("Restore This Version");
      expect(restoreButtons.length).toBe(2); // v1 + v2
    });
  });
});
