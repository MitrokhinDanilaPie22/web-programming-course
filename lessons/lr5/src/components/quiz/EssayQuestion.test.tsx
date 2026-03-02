import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EssayQuestion } from './EssayQuestion';

describe('EssayQuestion', () => {
  const mockQuestion = {
    id: 'q1',
    type: 'essay' as const,
    question: 'Explain React hooks',
    minLength: 50,
    maxLength: 500,
    difficulty: 'medium' as const,
    maxPoints: 10,
  };

  it('отображается поле ввода', () => { 
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer=""
        onTextChange={() => {}}
      />
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument(); //есть ли поле ввода
  });

  it('показывается ли количество символов', () => {
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer="Hello World"
        onTextChange={() => {}}
      />
    );
    expect(screen.getByText(/Символов: 11/)).toBeInTheDocument();//показывается ли количество символов
  });

  it('показывается минимальная длина текста', () => {
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer=""
        onTextChange={() => {}}
      />
    );
    expect(screen.getByText(/минимум: 50/)).toBeInTheDocument();//показывается ли минимальная длина текста
  });

  it('показывается максимальная длина текстаt', () => {
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer=""
        onTextChange={() => {}}
      />
    );
    expect(screen.getByText(/максимум: 500/)).toBeInTheDocument();//показывается ли максимальная длина текста
  });

  it('вызвана функция onTextChange, когда пользователь вводит текст', async () => {
    const handleChange = vi.fn();
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer=""
        onTextChange={handleChange}
      />
    );

    const user = userEvent.setup();
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'New text');

    expect(handleChange).toHaveBeenCalled();//была ли вызвана функция при вводе текста пользователем
  });

  it('отображается текущий текст в textarea', () => {
    const currentAnswer = 'This is my current answer';
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer={currentAnswer}
        onTextChange={() => {}}
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue(currentAnswer);//отображается ли введенный текст пользователя в textarea
  });
});