import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { gql, InMemoryCache } from '@apollo/client';
import DocsFrontend from '../components/DocsFrontend';

jest.mock('../components/DocsFrontend.css', () => ({}));
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
  Sun: () => <div data-testid="sun-icon" />,
  Moon: () => <div data-testid="moon-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Code: () => <div data-testid="code-icon" />,
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
            content: '<p>Replace me</p>',
            lastModified: '2023-10-31T00:00:00Z',
          },
        ],
      },
    },
  },
];

const renderWithProviders = (component) => {
  return render(
    <MockedProvider mocks={mocks} cache={new InMemoryCache()}>
      {component}
    </MockedProvider>
  );
};

describe('DocsFrontend extra tests', () => {
  test('keyboard shortcuts trigger formatting', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument();
    });

    // simulate Ctrl/Cmd+B
    const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true });
    document.dispatchEvent(event);

    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
  });

  test('create new document via menu', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => expect(screen.getByTestId('menu-icon')).toBeInTheDocument());

    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton);

    await waitFor(() => expect(screen.getByText('New Document')).toBeInTheDocument());

    const newBtn = screen.getByText('New Document');
    fireEvent.click(newBtn);

    // new doc should set an input with value 'Untitled Doc' or similar
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Untitled/i)).toBeInTheDocument();
    });
  });

  test('replace all works and updates editor text', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => expect(screen.getByText('Find / Replace')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Find / Replace'));

    // set editor content
    const editor = document.querySelector('.editor-content') || document.querySelector('[contenteditable]');
    expect(editor).toBeTruthy();
    if (editor) editor.innerHTML = '<p>Replace me and Replace me</p>';

    const findInput = screen.getByLabelText('Find');
    const replaceInput = screen.getByLabelText('Replace');

    fireEvent.change(findInput, { target: { value: 'Replace' } });
    fireEvent.change(replaceInput, { target: { value: 'Keep' } });

    fireEvent.click(screen.getByText('Replace All'));

    expect(editor.textContent).toContain('Keep me and Keep me');
  });
});
