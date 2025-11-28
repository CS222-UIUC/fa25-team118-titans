import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import DeleteDocumentButton from "../components/DeleteDocumentButton";
import { gql } from "@apollo/client";

jest.mock("../components/DeleteDocumentButton.css", () => ({}));
jest.mock("lucide-react", () => ({
  Trash: () => <div data-testid="trash-icon" />,
}));

const mockConfirm = jest.spyOn(window, "confirm");
const mockAlert = jest.spyOn(window, "alert");
mockAlert.mockImplementation(() => {});
mockConfirm.mockImplementation(() => true);

const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;

const renderWithApollo = (mocks, props) =>
  render(
    <MockedProvider mocks={mocks}>
      <DeleteDocumentButton {...props} />
    </MockedProvider>
  );

describe("DeleteDocumentButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders delete button with icon", () => {
    renderWithApollo([], { documentId: 1 });
    expect(screen.getByText("Delete Selected Document")).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
  });

  test("alerts when no document is selected", () => {
    renderWithApollo([], { documentId: null });
    fireEvent.click(screen.getByRole("button"));
    expect(mockAlert).toHaveBeenCalledWith("No document selected.");
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  test("does not delete if user cancels confirmation", () => {
    mockConfirm.mockReturnValueOnce(false);
    renderWithApollo([], { documentId: 1 });
    fireEvent.click(screen.getByRole("button"));
    expect(mockConfirm).toHaveBeenCalled();
    expect(mockAlert).not.toHaveBeenCalledWith("Document deleted.");
  });

  test("successful delete triggers alert + callback", async () => {
    const onDeleted = jest.fn();
    const mocks = [
        {
        request: {
            query: DELETE_DOCUMENT,
            variables: { id: 1 },
        },
        result: {
            data: { deleteDocument: true },
        },
        },
    ];

    renderWithApollo(mocks, { documentId: 1, onDeleted });

    await act(async () => {
        fireEvent.click(screen.getByRole("button"));
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockAlert).toHaveBeenCalledWith("Document deleted.");
    expect(onDeleted).toHaveBeenCalled();
  });

  test("failed delete alerts error message", async () => {
    const mocks = [
      {
        request: {
          query: DELETE_DOCUMENT,
          variables: { id: 1 },
        },
        result: {
          data: { deleteDocument: false },
        },
      },
    ];
    renderWithApollo(mocks, { documentId: 1 });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Document not found or could not be deleted."
      );
    });
  });

  test("mutation is called with correct variables", async () => {
    const mocks = [
      {
        request: {
          query: DELETE_DOCUMENT,
          variables: { id: 123 },
        },
        result: { data: { deleteDocument: true } },
      },
    ];
    renderWithApollo(mocks, { documentId: 123 });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Document deleted.");
    });
  });

  test("button shows loading state", async () => {
    const mocks = [
      {
        request: {
          query: DELETE_DOCUMENT,
          variables: { id: 5 },
        },
        result: new Promise(() => {}),
      },
    ];
    renderWithApollo(mocks, { documentId: 5 });
    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByText("Deleting...")).toBeInTheDocument();
  });
});
