import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import App from '../App';

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

test('renders the app without crashing', () => {
  render(
    <MockedProvider mocks={mocks}>
      <App />
    </MockedProvider>
  );

  expect(screen.getByText('Save')).toBeInTheDocument();
});
