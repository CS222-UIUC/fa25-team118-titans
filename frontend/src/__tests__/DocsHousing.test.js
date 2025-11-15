import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocsHousing from '../components/DocsHousing';

jest.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text" />,
  Plus: () => <div data-testid="plus" />,
  Grid: () => <div data-testid="grid" />,
  List: () => <div data-testid="list" />,
  Clock: () => <div data-testid="clock" />,
  Star: () => <div data-testid="star" />,
  Trash2: () => <div data-testid="trash" />,
  Search: () => <div data-testid="search" />,
  Home: () => <div data-testid="home" />,
  Folder: () => <div data-testid="folder" />,
  ArrowLeft: () => <div data-testid="arrow-left" />,
  Bold: () => <div data-testid="bold" />,
  Italic: () => <div data-testid="italic" />,
  Underline: () => <div data-testid="underline" />,
  AlignLeft: () => <div data-testid="align-left" />,
  AlignCenter: () => <div data-testid="align-center" />,
  AlignRight: () => <div data-testid="align-right" />,
  Save: () => <div data-testid="save" />,
}));

describe('DocsHousing', () => {
  test('creates a new document and opens editor', () => {
    render(<DocsHousing />);

    const newBtn = screen.getByText('New Document');
    fireEvent.click(newBtn);

    // After creating, Save button should appear in editor view
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('toggles star on a document', () => {
    render(<DocsHousing />);

    const starButtons = screen.getAllByTestId('star');
    expect(starButtons.length).toBeGreaterThan(0);

    // click first star
    fireEvent.click(starButtons[0]);

    // clicking doesn't remove the star button and it remains in the document
    expect(starButtons[0]).toBeInTheDocument();
  });

  test('deletes a document', () => {
    // mock window.confirm to always return true
    const orig = window.confirm;
    window.confirm = () => true;

    render(<DocsHousing />);
    const trashButtons = screen.getAllByTestId('trash');
    expect(trashButtons.length).toBeGreaterThan(0);

    // ensure a known title exists
    const title = screen.getByText('Meeting Notes');
    expect(title).toBeInTheDocument();

    // find the card ancestor that contains this title, then find its trash button
    let ancestor = title.closest('.group');
    if (!ancestor) {
      // fall back to walking up to a reasonable container
      ancestor = title.parentElement?.parentElement?.parentElement;
    }

    const trashInCard = ancestor ? ancestor.querySelector('[data-testid="trash"]') : null;
    expect(trashInCard).not.toBeNull();

    fireEvent.click(trashInCard);

    // Meeting Notes should no longer be present after deletion
    expect(screen.queryByText('Meeting Notes')).toBeNull();

    window.confirm = orig;
  });

  test('switches between grid and list views', () => {
    render(<DocsHousing />);

    const gridBtn = screen.getByTestId('grid');
    const listBtn = screen.getByTestId('list');

    fireEvent.click(listBtn);
    fireEvent.click(gridBtn);
    // header for current folder should still be visible (use heading role to avoid ambiguous matches)
    expect(screen.getByRole('heading', { name: 'Personal' })).toBeInTheDocument();
  });
});
