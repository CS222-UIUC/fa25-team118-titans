import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { gql, InMemoryCache } from '@apollo/client';
import DocsFrontend from '../components/DocsFrontend';
import { DOC_TEMPLATES } from '../components/docTemplates';

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
  Trash: () => <div data-testid="trash-icon" />,
}));

beforeEach(() => {
  document.execCommand = jest.fn();
});

const GET_DOCUMENTS = gql`
  query GetDocuments {
    documents {
      id
      title
      content
      lastModified
    }
  }
`;

const CREATE_DOCUMENT = gql`
  mutation CreateDocument($title: String!, $content: String) {
    createDocument(title: $title, content: $content) {
      id
      title
      content
      lastModified
    }
  }
`;

const mocks = [
  {
    request: {
      query: GET_DOCUMENTS,
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
    <MockedProvider mocks={mocks} cache={new InMemoryCache()}>
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

  test('inserts a code block snippet', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => {
      expect(screen.getByTestId('code-icon')).toBeInTheDocument();
    });

    const codeButton = screen.getByTestId('code-icon').closest('button');
    fireEvent.click(codeButton);

    expect(document.execCommand).toHaveBeenCalledWith(
      'insertHTML',
      false,
      expect.stringContaining('code-block')
    );
  });

  test('find and replace updates editor content', async () => {
    renderWithProviders(<DocsFrontend />);

    await waitFor(() => {
      expect(screen.getByText('Find / Replace')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByText('Find / Replace');
    fireEvent.click(toggleBtn);

    const editor = document.querySelector('.editor-content');
    fireEvent.input(editor, { target: { innerHTML: '<p>Replace me</p>' } });

    const searchInput = screen.getByLabelText('Find');
    const replaceInput = screen.getByLabelText('Replace');

    fireEvent.change(searchInput, { target: { value: 'Replace' } });
    fireEvent.change(replaceInput, { target: { value: 'Keep' } });

    const replaceAllButton = screen.getByText('Replace All');
    fireEvent.click(replaceAllButton);

    expect(editor.textContent).toContain('Keep me');
  });

  test('creates a new document from the template picker', async () => {
    const template = DOC_TEMPLATES[0];
    const templateMocks = [
      {
        request: {
          query: GET_DOCUMENTS,
        },
        result: {
          data: {
            documents: [],
          },
        },
      },
      {
        request: {
          query: CREATE_DOCUMENT,
          variables: {
            title: template.title,
            content: template.content,
          },
        },
        result: {
          data: {
            createDocument: {
              __typename: 'Document',
              id: '99',
              title: template.title,
              content: template.content,
              lastModified: '2023-11-15T00:00:00Z',
            },
          },
        },
      },
      {
        request: {
          query: GET_DOCUMENTS,
        },
        result: {
          data: {
            documents: [
              {
                __typename: 'Document',
                id: '99',
                title: template.title,
                content: template.content,
                lastModified: '2023-11-15T00:00:00Z',
              },
            ],
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={templateMocks} cache={new InMemoryCache()}>
        <DocsFrontend />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('menu-icon').closest('button'));

    const templateSelect = await screen.findByLabelText(/Start from template/i);
    fireEvent.change(templateSelect, { target: { value: template.id } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(template.title)).toBeInTheDocument();
    });
  });
});