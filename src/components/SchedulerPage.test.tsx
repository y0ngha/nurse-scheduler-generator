import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchedulerPage } from '../app/SchedulerPage';

test('SchedulerPage renders generate button and schedule table area', () => {
  render(<SchedulerPage />);
  expect(screen.getByRole('button', { name: /generate schedule/i })).toBeInTheDocument();
  expect(screen.getByText(/no schedule generated/i)).toBeInTheDocument();
});
