import { describe, it, expect, beforeEach } from 'vitest';
import { GameStore } from './gameStore';

describe('GameStore', () => {
  let store: GameStore;

  beforeEach(() => {
    store = new GameStore();
  });

  it('инициализируется со состоянием по умолчанию', () => {
    expect(store.isPlaying).toBe(false);
    expect(store.currentQuestionIndex).toBe(0);
    expect(store.selectedAnswers).toEqual([]);
    expect(store.textAnswer).toBe('');
    expect(store.questions).toEqual([]);
    expect(store.answers).toEqual([]);
  });

  it('правильно переключает (включает и выключает) ответы', () => {
    store.toggleAnswer(0);
    expect(store.selectedAnswers).toEqual([0]);
    store.toggleAnswer(0);
    expect(store.selectedAnswers).toEqual([]);
  });

  it('устанавливает текстовый ответ', () => {
    store.setTextAnswer('Hello');
    expect(store.textAnswer).toBe('Hello');
    store.setTextAnswer('');
    expect(store.textAnswer).toBe('');
  });

  it('переходит к следующему вопросу и сбрасывает ответы', () => {
    store.questions = [
      { id: '1', type: 'multiple', question: 'Q1', options: ['A'], correctAnswers: [0], difficulty: 'easy' },
      { id: '2', type: 'essay', question: 'Q2', difficulty: 'medium' },
    ];
    store.selectedAnswers = [0];
    store.textAnswer = 'test';
    store.currentQuestionIndex = 0;

    store.nextQuestion();

    expect(store.currentQuestionIndex).toBe(1);
    expect(store.selectedAnswers).toEqual([]);
    expect(store.textAnswer).toBe('');
  });
});
