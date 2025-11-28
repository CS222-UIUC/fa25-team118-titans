import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import DeleteDocumentButton, { DELETE_DOCUMENT } from "../components/DeleteDocumentButton.jsx";

describe("DeleteDocumentButton", () => {
  const documentId = "123";
  const onDeletedMock = jest.fn();

  const mocks = [
    {
      request: {
        query: DELETE_DOCUMENT,
        variables: { id: documentId },
      },
      result: {
        data: {
          deleteDocument: true,
        },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders button with initial text", () => {
    render(
      <MockedProvider mocks={mocks}>
        <DeleteDocumentButton documentId={documentId} />
      </MockedProvider>
    );

    expect(screen.getByText("Delete Selected Document")).toBeInTheDocument();
  });

  test("alerts if no documentId provided", () => {
    window.alert = jest.fn();

    render(
      <MockedProvider mocks={mocks}>
        <DeleteDocumentButton />
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole("button"));

    expect(window.alert).toHaveBeenCalledWith("No document selected.");
  });

  test("cancels deletion if confirmation is declined", () => {
    window.confirm = jest.fn(() => false);
    window.alert = jest.fn();

    render(
      <MockedProvider mocks={mocks}>
        <DeleteDocumentButton documentId={documentId} />
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole("button"));

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this document?"
    );
    expect(window.alert).not.toHaveBeenCalled();
  });

  test("calls mutation and onDeleted on confirmation", async () => {
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();

    render(
      <MockedProvider mocks={mocks}>
        <DeleteDocumentButton documentId={documentId} onDeleted={onDeletedMock} />
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Document deleted."));
    expect(onDeletedMock).toHaveBeenCalled();
  });

  test("shows error alert if mutation fails", async () => {
    const errorMocks = [
      {
        request: {
          query: DELETE_DOCUMENT,
          variables: { id: documentId },
        },
        error: new Error("Network error"),
      },
    ];

    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
    console.error = jest.fn();

    render(
      <MockedProvider mocks={errorMocks}>
        <DeleteDocumentButton documentId={documentId} />
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Error deleting document."));
    expect(console.error).toHaveBeenCalled();
  });
});
