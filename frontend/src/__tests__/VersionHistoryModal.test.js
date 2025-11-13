import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import VersionHistoryModal from "../components/VersionHistoryModal";

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

describe("VersionHistoryModal", () => {
  test("renders loading and version list", async () => {
    render(
      <MockedProvider mocks={versionMocks} addTypename={false}>
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
      <MockedProvider mocks={emptyVersionMocks} addTypename={false}>
        <VersionHistoryModal documentId="1" onClose={jest.fn()} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No versions found/i)).toBeInTheDocument();
    });
  });

  test("renders nothing if no documentId provided", () => {
    const { container } = render(
      <MockedProvider mocks={versionMocks} addTypename={false}>
        <VersionHistoryModal onClose={jest.fn()} />
      </MockedProvider>
    );

    expect(container.firstChild).toBeNull();
  });
});
