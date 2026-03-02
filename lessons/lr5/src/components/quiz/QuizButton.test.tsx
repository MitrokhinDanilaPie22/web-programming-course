import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuizButton } from './QuizButton';

describe('QuizButton', () => {
  it('отображается ли кнопка с текстом', () => {
    render(<QuizButton onClick={() => {}}>Click me</QuizButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();//
  });

  it('вызывается функция onClick, когда пользователь нажимает', async () => {
    const handleClick = vi.fn();
    render(<QuizButton onClick={handleClick}>Submit</QuizButton>);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('у кнопки должен быть атрибут disabled', () => {
    render(<QuizButton onClick={() => {}} disabled>Disabled</QuizButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('не вызывать функция onClick когда атрибут disabled', async () => {
    const handleClick = vi.fn();
    render(<QuizButton onClick={handleClick} disabled>Disabled</QuizButton>);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('должны быть стили по умолчанию', () => {
    render(<QuizButton onClick={() => {}}>Primary</QuizButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-blue-500');
  });

  it('использоватьвторичные варианты стилей, если указано', ( ) => {
    render(<QuizButton onClick={() => {}} variant="secondary">Secondary</QuizButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-gray-200');
  });
});