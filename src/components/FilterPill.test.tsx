import { render, screen, fireEvent } from '@testing-library/react';
import FilterPill from './FilterPill';

describe('FilterPill', () => {
  it('renders label text', () => {
    render(<FilterPill label="Completed" count={5} isActive={false} onClick={() => {}} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders count in badge', () => {
    render(<FilterPill label="Completed" count={5} isActive={false} onClick={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies bg-primary when active', () => {
    render(<FilterPill label="Completed" count={5} isActive={true} onClick={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary');
  });

  it('applies color.bg when inactive with color', () => {
    render(
      <FilterPill
        label="Completed"
        count={5}
        isActive={false}
        onClick={() => {}}
        color={{ bg: 'bg-success-light', text: 'text-success-dark' }}
      />
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-success-light');
  });

  it('applies bg-gray-100 when inactive without color', () => {
    render(<FilterPill label="Test" count={0} isActive={false} onClick={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-gray-100');
  });

  it('applies text-white when active', () => {
    render(<FilterPill label="Test" count={0} isActive={true} onClick={() => {}} />);
    expect(screen.getByText('Test').className).toContain('text-white');
  });

  it('shows dot when active and showDot=true', () => {
    render(<FilterPill label="Test" count={0} isActive={true} onClick={() => {}} showDot />);
    const dot = screen.getByTestId('filter-pill-dot');
    expect(dot).toBeInTheDocument();
  });

  it('hides dot when inactive', () => {
    render(<FilterPill label="Test" count={0} isActive={false} onClick={() => {}} showDot />);
    expect(screen.queryByTestId('filter-pill-dot')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<FilterPill label="Test" count={0} isActive={false} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has aria-pressed matching isActive', () => {
    const { rerender } = render(<FilterPill label="Test" count={0} isActive={false} onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

    rerender(<FilterPill label="Test" count={0} isActive={true} onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('has descriptive aria-label', () => {
    render(<FilterPill label="Completed" count={5} isActive={false} onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Filter by Completed, 5 orders');
  });
});
