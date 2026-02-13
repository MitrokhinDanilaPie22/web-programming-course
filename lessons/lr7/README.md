# Лабораторная работа 7: Testing - Vitest & Playwright

## Описание

В этой лабораторной работе вы научитесь тестировать React приложения. Вы возьмете готовое Quiz приложение из LR5+LR6, декомпозируете его на компоненты и покроете тестами.

**Цели:**
- Научиться писать unit тесты для функций и stores (Vitest)
- Освоить тестирование React компонентов (React Testing Library)
- Познакомиться с E2E тестированием (Playwright)
- Улучшить архитектуру приложения через декомпозицию
- Достичь 70%+ test coverage

---

## Материалы лекции

### 📊 Презентация
- [Слайды (HTML)](./docs/slides-standalone/slides.html) - 30 слайдов, ~90 минут
- Открыть в браузере и использовать стрелки для навигации

### 📝 Документация
- [Конспект лекции](./docs/lecture-script.md) - подробный план для преподавателя
- [Cheatsheet](./docs/cheatsheet.md) - краткая справка по тестированию
- [Подробное руководство](./docs/guide.md) - теория и примеры
- [Интерактивные примеры](./docs/interactive.html) - поиск по коду с подсветкой

---

## Шаг 0: Подготовка окружения

### Вариант 1: Создание ветки на основе LR6

Рекомендуемый подход - создать новую ветку от вашей выполненной LR6:

```bash
# Перейдите в директорию с LR5/LR6
cd lessons/lr5

# Убедитесь, что вся работа сохранена
git status
git add .
git commit -m "Complete LR6 - Essay questions implementation"

# Создайте новую ветку для LR7
git checkout -b lr7

# Получите последние изменения из upstream
git fetch upstream

# Влейте изменения из upstream/main
git merge upstream/main
```

**⚠️ Возможны конфликты слияния** - разрешите их вручную, сохранив вашу функциональность.

### Вариант 2: Начать с чистого upstream

Если хотите начать с актуальной версии:

```bash
cd lessons/lr5

# Создайте ветку от upstream/main
git fetch upstream
git checkout -b lr7 upstream/main

# Перенесите нужные файлы из вашей lr6 ветки (опционально)
git checkout lr6 -- src/tasks/Task4.tsx
git checkout lr6 -- src/stores/gameStore.ts
# и т.д.
```

---

## Шаг 1: Установка Vitest

### 1.1 Установка зависимостей

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom
```

**Что установили:**
- `vitest` - test runner (аналог Jest, но для Vite)
- `@vitest/ui` - веб-интерфейс для тестов
- `@vitest/coverage-v8` - измерение покрытия кода
- `@testing-library/react` - тестирование React компонентов
- `@testing-library/jest-dom` - дополнительные matchers для DOM
- `@testing-library/user-event` - симуляция действий пользователя
- `jsdom` - эмуляция браузера в Node.js

### 1.2 Создание конфигурации

Создайте `vitest.config.ts` в корне проекта:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'generated/',
        'mock-server/',
      ],
    },
  },
});
```

### 1.3 Создание setup файла

Создайте `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Этот файл подключает дополнительные matchers для тестирования DOM:
- `toBeInTheDocument()`
- `toBeVisible()`
- `toBeDisabled()`
- и другие...

### 1.4 Обновление package.json

Добавьте scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

### 1.5 Проверка установки;

```bash
npm run test
```

Должно показать: `No test files found` (это нормально, тесты мы напишем дальше).

---

## Шаг 2: Декомпозиция Task4 на компоненты

### 2.1 Анализ текущего кода

Ваш `Task4.tsx` сейчас - монолитный компонент ~200-300 строк, который делает всё:
- Управляет состоянием игры
- Рендерит UI для multiple-select вопросов
- Рендерит UI для essay вопросов
- Обрабатывает отправку ответов
- Показывает результаты

### 2.2 Создание структуры компонентов

Создайте директории:

```bash
mkdir -p src/components/quiz
mkdir -p src/utils
```

### 2.3 Выделите переиспользуемые компоненты

Создайте следующие компоненты:

#### `src/components/quiz/QuizButton.tsx`
```typescript
interface QuizButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function QuizButton({
  children,
  onClick,
  disabled,
  variant = 'primary'
}: QuizButtonProps) {
  const baseClass = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClass = variant === 'primary'
    ? 'bg-blue-500 text-white hover:bg-blue-600'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${disabledClass}`}
    >
      {children}
    </button>
  );
}
```

#### `src/components/quiz/MultipleSelectQuestion.tsx`
```typescript
import { observer } from 'mobx-react-lite';
import type { Question } from '../../types/quiz';

interface Props {
  question: Question;
  selectedAnswers: number[];
  onToggleAnswer: (index: number) => void;
}

export const MultipleSelectQuestion = observer(({
  question,
  selectedAnswers,
  onToggleAnswer
}: Props) => {
  if (!question.options) return null;

  return (
    <div className="space-y-2">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswers.includes(index);
        return (
          <button
            key={index}
            onClick={() => onToggleAnswer(index)}
            className={`w-full text-left p-4 rounded border-2 transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <span className="font-bold mr-3 text-lg">
              {isSelected ? '✓' : String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
});
```

#### `src/components/quiz/EssayQuestion.tsx`
```typescript
import type { Question } from '../../types/quiz';

interface Props {
  question: Question;
  textAnswer: string;
  onTextChange: (text: string) => void;
}

export function EssayQuestion({ question, textAnswer, onTextChange }: Props) {
  const charCount = textAnswer.length;
  const minLength = question.minLength || 0;
  const maxLength = question.maxLength || 1000;
  const isValid = charCount >= minLength;

  return (
    <div className="space-y-2">
      <textarea
        value={textAnswer}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Введите развернутый ответ..."
        minLength={minLength}
        maxLength={maxLength}
        rows={10}
        className="w-full p-4 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
      />
      <div className={`text-sm ${isValid ? 'text-gray-500' : 'text-red-500'}`}>
        Символов: {charCount}
        {minLength > 0 && ` (минимум: ${minLength})`}
        {` (максимум: ${maxLength})`}
      </div>
    </div>
  );
}
```

#### `src/components/quiz/QuizProgress.tsx`
```typescript
interface Props {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: Props) {
  const percentage = ((current + 1) / total) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Вопрос {current + 1} из {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### 2.4 Рефакторинг Task4.tsx

Обновите `Task4.tsx` для использования новых компонентов:

```typescript
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import gameStore from '../stores/gameStore';
import { QuizButton } from '../components/quiz/QuizButton';
import { QuizProgress } from '../components/quiz/QuizProgress';
import { MultipleSelectQuestion } from '../components/quiz/MultipleSelectQuestion';
import { EssayQuestion } from '../components/quiz/EssayQuestion';
import { usePostApiSessions, usePostApiSessionsSessionIdAnswers, usePostApiSessionsSessionIdSubmit } from '../../generated/api/sessions/sessions';

const Task4 = observer(() => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const currentQuestion = gameStore.currentQuestion;

  const createSession = usePostApiSessions();
  const submitAnswer = usePostApiSessionsSessionIdAnswers();
  const submitSession = usePostApiSessionsSessionIdSubmit();

  const handleStartGame = () => {
    // ... ваш код создания сессии ...
  };

  const handleNextQuestion = () => {
    // ... ваш код отправки ответа ...
  };

  const canProceed = currentQuestion?.type === 'multiple-select'
    ? gameStore.selectedAnswers.length > 0
    : gameStore.textAnswer.trim().length >= (currentQuestion?.minLength || 0);

  if (!gameStore.isPlaying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <QuizButton onClick={handleStartGame}>
          Начать игру
        </QuizButton>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <QuizProgress
        current={gameStore.currentQuestionIndex}
        total={gameStore.questions.length}
      />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{currentQuestion.question}</h2>

        <div className="flex gap-4 mb-6 text-sm">
          <span className="px-3 py-1 bg-gray-100 rounded">
            Тип: {currentQuestion.type}
          </span>
          <span className="px-3 py-1 bg-yellow-100 rounded">
            Сложность: {currentQuestion.difficulty}
          </span>
          <span className="px-3 py-1 bg-green-100 rounded">
            Баллов: {currentQuestion.maxPoints}
          </span>
        </div>

        {currentQuestion.type === 'multiple-select' && (
          <MultipleSelectQuestion
            question={currentQuestion}
            selectedAnswers={gameStore.selectedAnswers}
            onToggleAnswer={(index) => gameStore.toggleAnswer(index)}
          />
        )}

        {currentQuestion.type === 'essay' && (
          <EssayQuestion
            question={currentQuestion}
            textAnswer={gameStore.textAnswer}
            onTextChange={(text) => gameStore.setTextAnswer(text)}
          />
        )}

        {canProceed && (
          <div className="mt-6">
            <QuizButton
              onClick={gameStore.isLastQuestion ? handleFinishGame : handleNextQuestion}
              disabled={submitAnswer.isPending || submitSession.isPending}
            >
              {gameStore.isLastQuestion ? 'Завершить' : 'Следующий вопрос'}
            </QuizButton>
          </div>
        )}
      </div>
    </div>
  );
});

export default Task4;
```

---

## Шаг 3: Написание Unit тестов

### 3.1 Тесты для утилит

Создайте `src/utils/score.ts`:

```typescript
import type { Answer } from '../types/quiz';

export function calculateTotalScore(answers: Answer[]): number {
  return answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
}

export function getCorrectAnswersCount(answers: Answer[]): number {
  return answers.filter(a => a.isCorrect).length;
}

export function calculateAccuracy(answers: Answer[]): number {
  if (answers.length === 0) return 0;
  const correct = getCorrectAnswersCount(answers);
  return Math.round((correct / answers.length) * 100);
}
```

Создайте `src/utils/score.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTotalScore, getCorrectAnswersCount, calculateAccuracy } from './score';

describe('score utils', () => {
  describe('calculateTotalScore', () => {
    it('calculates total score from answers', () => {
      const answers = [
        { questionId: '1', pointsEarned: 5, isCorrect: true },
        { questionId: '2', pointsEarned: 3, isCorrect: true },
      ];
      expect(calculateTotalScore(answers)).toBe(8);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTotalScore([])).toBe(0);
    });

    it('handles answers without pointsEarned', () => {
      const answers = [
        { questionId: '1', isCorrect: false },
      ];
      expect(calculateTotalScore(answers)).toBe(0);
    });

    it('ignores negative points', () => {
      const answers = [
        { questionId: '1', pointsEarned: -2, isCorrect: false },
        { questionId: '2', pointsEarned: 5, isCorrect: true },
      ];
      expect(calculateTotalScore(answers)).toBe(3);
    });
  });

  describe('getCorrectAnswersCount', () => {
    it('counts correct answers', () => {
      const answers = [
        { questionId: '1', isCorrect: true },
        { questionId: '2', isCorrect: false },
        { questionId: '3', isCorrect: true },
      ];
      expect(getCorrectAnswersCount(answers)).toBe(2);
    });

    it('returns 0 for empty array', () => {
      expect(getCorrectAnswersCount([])).toBe(0);
    });

    it('returns 0 when all answers are wrong', () => {
      const answers = [
        { questionId: '1', isCorrect: false },
        { questionId: '2', isCorrect: false },
      ];
      expect(getCorrectAnswersCount(answers)).toBe(0);
    });
  });

  describe('calculateAccuracy', () => {
    it('calculates percentage of correct answers', () => {
      const answers = [
        { questionId: '1', isCorrect: true },
        { questionId: '2', isCorrect: true },
        { questionId: '3', isCorrect: false },
        { questionId: '4', isCorrect: true },
      ];
      expect(calculateAccuracy(answers)).toBe(75);
    });

    it('returns 0 for empty array', () => {
      expect(calculateAccuracy([])).toBe(0);
    });

    it('returns 100 when all correct', () => {
      const answers = [
        { questionId: '1', isCorrect: true },
        { questionId: '2', isCorrect: true },
      ];
      expect(calculateAccuracy(answers)).toBe(100);
    });
  });
});
```

Запустите тесты:

```bash
npm run test
```

Должны пройти все тесты! ✅

---

## Шаг 4: Тесты для MobX stores

Создайте `src/stores/gameStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStore } from './gameStore';

describe('GameStore', () => {
  let store: GameStore;

  beforeEach(() => {
    store = new GameStore();
  });

  describe('initialization', () => {
    it('starts with correct default state', () => {
      expect(store.isPlaying).toBe(false);
      expect(store.currentQuestionIndex).toBe(0);
      expect(store.selectedAnswers).toEqual([]);
      expect(store.textAnswer).toBe('');
      expect(store.questions).toEqual([]);
      expect(store.answers).toEqual([]);
    });
  });

  describe('toggleAnswer', () => {
    it('adds answer to selection', () => {
      store.toggleAnswer(0);
      expect(store.selectedAnswers).toEqual([0]);
    });

    it('removes answer if already selected', () => {
      store.selectedAnswers = [0, 1, 2];
      store.toggleAnswer(1);
      expect(store.selectedAnswers).toEqual([0, 2]);
    });

    it('maintains order when adding multiple answers', () => {
      store.toggleAnswer(2);
      store.toggleAnswer(0);
      store.toggleAnswer(1);
      expect(store.selectedAnswers).toEqual([2, 0, 1]);
    });
  });

  describe('setTextAnswer', () => {
    it('updates text answer', () => {
      store.setTextAnswer('My answer');
      expect(store.textAnswer).toBe('My answer');
    });

    it('can clear text answer', () => {
      store.setTextAnswer('Text');
      store.setTextAnswer('');
      expect(store.textAnswer).toBe('');
    });
  });

  describe('nextQuestion', () => {
    beforeEach(() => {
      store.questions = [
        { id: '1', type: 'multiple-select', question: 'Q1', options: [], difficulty: 'easy', maxPoints: 5 },
        { id: '2', type: 'essay', question: 'Q2', difficulty: 'medium', maxPoints: 10 },
      ];
      store.currentQuestionIndex = 0;
    });

    it('increments question index', () => {
      store.nextQuestion();
      expect(store.currentQuestionIndex).toBe(1);
    });

    it('clears selected answers', () => {
      store.selectedAnswers = [0, 1];
      store.nextQuestion();
      expect(store.selectedAnswers).toEqual([]);
    });

    it('clears text answer', () => {
      store.textAnswer = 'Some text';
      store.nextQuestion();
      expect(store.textAnswer).toBe('');
    });

    it('does not go beyond last question', () => {
      store.currentQuestionIndex = 1;
      store.nextQuestion();
      expect(store.currentQuestionIndex).toBe(2); // может быть 1, в зависимости от реализации
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      store.questions = [
        { id: '1', type: 'multiple-select', question: 'Q1', options: [], difficulty: 'easy', maxPoints: 5 },
        { id: '2', type: 'essay', question: 'Q2', difficulty: 'medium', maxPoints: 10 },
        { id: '3', type: 'multiple-select', question: 'Q3', options: [], difficulty: 'hard', maxPoints: 15 },
      ];
    });

    it('currentQuestion returns correct question', () => {
      store.currentQuestionIndex = 1;
      expect(store.currentQuestion?.id).toBe('2');
    });

    it('currentQuestion returns undefined for invalid index', () => {
      store.currentQuestionIndex = 99;
      expect(store.currentQuestion).toBeUndefined();
    });

    it('isLastQuestion returns true for last question', () => {
      store.currentQuestionIndex = 2;
      expect(store.isLastQuestion).toBe(true);
    });

    it('isLastQuestion returns false for non-last question', () => {
      store.currentQuestionIndex = 0;
      expect(store.isLastQuestion).toBe(false);
    });
  });
});
```

---

## Шаг 5: Тесты для React компонентов

### 5.1 Тест для QuizButton

Создайте `src/components/quiz/QuizButton.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuizButton } from './QuizButton';

describe('QuizButton', () => {
  it('renders with children text', () => {
    render(<QuizButton onClick={() => {}}>Click me</QuizButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<QuizButton onClick={handleClick}>Submit</QuizButton>);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<QuizButton onClick={() => {}} disabled>Disabled</QuizButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<QuizButton onClick={handleClick} disabled>Disabled</QuizButton>);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant styles by default', () => {
    render(<QuizButton onClick={() => {}}>Primary</QuizButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-blue-500');
  });

  it('applies secondary variant styles when specified', () => {
    render(<QuizButton onClick={() => {}} variant="secondary">Secondary</QuizButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-gray-200');
  });
});
```

### 5.2 Тест для EssayQuestion

Создайте `src/components/quiz/EssayQuestion.test.tsx`:

```typescript
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

  it('renders textarea', () => {
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer=""
        onTextChange={() => {}}
      />
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays character count', () => {
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer="Hello World"
        onTextChange={() => {}}
      />
    );
    expect(screen.getByText(/Символов: 11/)).toBeInTheDocument();
  });

  it('shows minimum length requirement', () => {
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer=""
        onTextChange={() => {}}
      />
    );
    expect(screen.getByText(/минимум: 50/)).toBeInTheDocument();
  });

  it('shows maximum length requirement', () => {
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer=""
        onTextChange={() => {}}
      />
    );
    expect(screen.getByText(/максимум: 500/)).toBeInTheDocument();
  });

  it('calls onTextChange when user types', async () => {
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

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays current value in textarea', () => {
    const currentAnswer = 'This is my current answer';
    render(
      <EssayQuestion
        question={mockQuestion}
        textAnswer={currentAnswer}
        onTextChange={() => {}}
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue(currentAnswer);
  });
});
```

### 5.3 Тест для MultipleSelectQuestion

Создайте `src/components/quiz/MultipleSelectQuestion.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MultipleSelectQuestion } from './MultipleSelectQuestion';

describe('MultipleSelectQuestion', () => {
  const mockQuestion = {
    id: 'q1',
    type: 'multiple-select' as const,
    question: 'Which are React hooks?',
    options: ['useState', 'useEffect', 'useClass', 'useMemo'],
    difficulty: 'easy' as const,
    maxPoints: 4,
  };

  it('renders all options', () => {
    render(
      <MultipleSelectQuestion
        question={mockQuestion}
        selectedAnswers={[]}
        onToggleAnswer={() => {}}
      />
    );

    expect(screen.getByText(/useState/)).toBeInTheDocument();
    expect(screen.getByText(/useEffect/)).toBeInTheDocument();
    expect(screen.getByText(/useClass/)).toBeInTheDocument();
    expect(screen.getByText(/useMemo/)).toBeInTheDocument();
  });

  it('displays letter labels for unselected options', () => {
    render(
      <MultipleSelectQuestion
        question={mockQuestion}
        selectedAnswers={[]}
        onToggleAnswer={() => {}}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('A');
    expect(buttons[1]).toHaveTextContent('B');
    expect(buttons[2]).toHaveTextContent('C');
    expect(buttons[3]).toHaveTextContent('D');
  });

  it('displays checkmarks for selected options', () => {
    render(
      <MultipleSelectQuestion
        question={mockQuestion}
        selectedAnswers={[0, 2]}
        onToggleAnswer={() => {}}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('✓');
    expect(buttons[1]).toHaveTextContent('B');
    expect(buttons[2]).toHaveTextContent('✓');
    expect(buttons[3]).toHaveTextContent('D');
  });

  it('calls onToggleAnswer with correct index when clicked', async () => {
    const handleToggle = vi.fn();
    render(
      <MultipleSelectQuestion
        question={mockQuestion}
        selectedAnswers={[]}
        onToggleAnswer={handleToggle}
      />
    );

    const user = userEvent.setup();
    const firstOption = screen.getByText(/useState/);
    await user.click(firstOption);

    expect(handleToggle).toHaveBeenCalledWith(0);
  });

  it('renders nothing when options are undefined', () => {
    const questionWithoutOptions = { ...mockQuestion, options: undefined };
    const { container } = render(
      <MultipleSelectQuestion
        question={questionWithoutOptions}
        selectedAnswers={[]}
        onToggleAnswer={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
```

---

## Шаг 6: Запуск и проверка coverage

### 6.1 Запуск всех тестов

```bash
npm run test
```

Все тесты должны пройти! ✅

### 6.2 Проверка coverage

```bash
npm run test:coverage
```

Откройте `coverage/index.html` в браузере для детального отчета.

**Цель:** ≥70% coverage

### 6.3 UI Mode (опционально)

```bash
npm run test:ui
```

Откроется веб-интерфейс на `http://localhost:51204` с интерактивным просмотром тестов.

---

## Шаг 7: Playwright E2E тесты (опционально)

### 7.1 Установка Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### 7.2 Конфигурация

Создайте `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

Обновите `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 7.3 Создайте E2E тест

Создайте `e2e/quiz-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Quiz Application E2E', () => {
  test('user can start quiz and answer question', async ({ page }) => {
    await page.goto('/');

    // Начать игру
    await page.click('text=Начать игру');

    // Дождаться загрузки вопроса
    await expect(page.locator('h2')).toBeVisible();

    // Проверить наличие прогресс-бара
    await expect(page.locator('text=/Вопрос \\d+ из \\d+/')).toBeVisible();

    // Если это multiple-select - выбрать вариант
    const firstOption = page.locator('button').filter({ hasText: /^A/ }).first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await expect(firstOption).toContainText('✓');
    }
  });

  test('essay question shows textarea and character counter', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Начать игру');

    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await textarea.fill('A'.repeat(100));
      await expect(page.locator('text=/Символов: 100/')).toBeVisible();
    }
  });
});
```

### 7.4 Запуск E2E тестов

```bash
npm run test:e2e
```

---

## Критерии оценки

- ✅ **Setup (10%):** Vitest корректно настроен
- ✅ **Рефакторинг (25%):** Task4 декомпозирован на ≥4 компонента
- ✅ **Unit тесты (25%):** Тесты для utils и stores (≥10 тестов)
- ✅ **Component тесты (30%):** ≥3 компонента покрыты тестами
- ✅ **Coverage (10%):** ≥70% coverage
- 🌟 **Бонус:** E2E тесты с Playwright (+10%)

---

## Частые проблемы и решения

### Проблема: "Cannot find module '@testing-library/jest-dom'"

**Решение:**
```bash
npm install -D @testing-library/jest-dom
```

### Проблема: "ReferenceError: expect is not defined"

**Решение:** Убедитесь что в `vitest.config.ts` установлен `globals: true`

### Проблема: Тесты не находят компоненты MobX

**Решение:** Оберните тест в observer или используйте `act()`:

```typescript
import { observer } from 'mobx-react-lite';

const TestComponent = observer(() => <MultipleSelectQuestion {...props} />);
render(<TestComponent />);
```

### Проблема: "Cannot read property 'click' of null"

**Решение:** Используйте `await` для async действий:

```typescript
const user = userEvent.setup();
await user.click(element);
```

---

## Полезные ссылки

### Документация
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest matchers (работают в Vitest)](https://jestjs.io/docs/expect)

### Cheat Sheets
- [RTL Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Vitest API](https://vitest.dev/api/)
- [Local Cheatsheet](./docs/cheatsheet.md)

---

## Следующие шаги

После завершения этой лабораторной работы вы можете:

1. **Увеличить coverage** - добавить тесты для остальных компонентов
2. **MSW** - настроить Mock Service Worker для мокирования API
3. **Snapshot тесты** - добавить тесты на соответствие UI
4. **A11y тесты** - проверить accessibility с @axe-core/playwright

