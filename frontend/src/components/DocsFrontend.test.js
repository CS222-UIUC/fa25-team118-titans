import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import DocsFrontend from './DocsFrontend';

jest.mock('./DocsFrontend.css', () => ({}));

jest.mock('lucide-react', () => ({
  Bold: () => <div data-testid="bold-icon" />,
  Italic: () => <div data-testid="italic-icon" />,
  Underline: () => <div data-testid="underline-icon" />,
  AlignLeft: () => <div data-testid="align-left-icon" />,
  AlignCenter: () => <div data-testid="align-center-icon" />,
  AlignRight: () => <div data-testid="align-right-icon" />,
  Save: () => <div data-testid="save-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
}));

beforeEach(() => {
  document.execCommand = jest.fn();
});

const mocks = [
  {
    request: {
      query: gql`
        query GetDocuments {
          documents {
            id
            title
            content
            lastModified
          }
        }
      `,
    },
    result: {
      data: {
        documents: [
          {
            __typename: 'Document',
            id: 1,
            title: 'Test Document',
            content: '<p>Test content</p>',
            lastModified: '2023-10-31T00:00:00Z',
          },
        ],
      },
    },
  },
];

const renderWithProviders = (component) => {
  return render(
    <MockedProvider mocks={mocks}>
      {component}
    </MockedProvider>
  );
};

describe('DocsFrontend', () => {
  test('renders the document editor', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue('Test Document');
      expect(titleInput).toBeInTheDocument();
    });

    expect(screen.getByRole('textbox')).toBeInTheDocument(); // title input
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('displays document list when menu button is clicked', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => {
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('New Document')).toBeInTheDocument();
    });
  });

  test('allows typing in the editor', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => {
      const editor = screen.getByRole('textbox', { hidden: true });
      expect(editor).toBeInTheDocument();
    });

    const editor = screen.getByRole('textbox', { hidden: true });
    fireEvent.input(editor, { target: { innerHTML: 'New content' } });

    expect(editor.innerHTML).toBe('New content');
  });

  test('changes font size', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => {
      const fontSelect = screen.getByDisplayValue('16');
      expect(fontSelect).toBeInTheDocument();
    });

    const fontSelect = screen.getByDisplayValue('16');
    fireEvent.change(fontSelect, { target: { value: '20' } });

    expect(fontSelect.value).toBe('20');
  });

  test('executes formatting commands', async () => {

    document.execCommand = jest.fn();

    renderWithProviders(<DocsFrontend />);

    await waitFor(() => {
      expect(screen.getByTestId('bold-icon')).toBeInTheDocument();
    });

    const boldButton = screen.getByTestId('bold-icon').closest('button');
    fireEvent.click(boldButton);

    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
  });
});