import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchedulerPage } from '../app/SchedulerPage';

test('SchedulerPage renders generate button and initial state', () => {
  render(<SchedulerPage />);
  expect(screen.getByRole('button', { name: /근무 스케줄 생성/i })).toBeInTheDocument();
  expect(screen.getByText(/권장:/)).toBeInTheDocument();
});

test('SchedulerPage generates and renders schedule on button click when valid', async () => {
  render(<SchedulerPage />);
  
  const generateBtn = screen.getByRole('button', { name: /근무 스케줄 생성/i });
  
  fireEvent.click(generateBtn);
  
  // 요소가 화면에 나타나는지 확인 (h2태그 내부 텍스트)
  const headings = await screen.findAllByRole('heading');
  const found = headings.some(h => h.textContent?.includes('생성된 근무표'));
  expect(found).toBe(true);
});
