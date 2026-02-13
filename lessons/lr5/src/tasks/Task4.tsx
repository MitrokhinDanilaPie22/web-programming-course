import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { gameStore } from '../stores/gameStore'
import { useUIStore } from '../stores/uiStore'
import { usePostApiSessions } from '../../generated/api/sessions/sessions'
import { usePostApiSessionsSessionIdAnswers } from '../../generated/api/sessions/sessions'
import { usePostApiSessionsSessionIdSubmit } from '../../generated/api/sessions/sessions'
import type { Question } from '../types/quiz'

const Task4 = observer(() => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [essayAnswer, setEssayAnswer] = useState<string>('')

  const createSession = usePostApiSessions()
  const submitAnswer = usePostApiSessionsSessionIdAnswers()
  const submitSession = usePostApiSessionsSessionIdSubmit()

  const { gameStatus, currentQuestion, selectedAnswers, score, progress } =
    gameStore

  const theme = useUIStore(state => state.theme)
  const soundEnabled = useUIStore(state => state.soundEnabled)
  const toggleTheme = useUIStore(state => state.toggleTheme)

  const bgGradient =
    theme === 'light'
      ? 'from-purple-500 to-indigo-600'
      : 'from-gray-900 to-black'

  const cardBg = theme === 'light' ? 'bg-white' : 'bg-gray-800'
  const textColor = theme === 'light' ? 'text-gray-800' : 'text-white'
  const mutedText = theme === 'light' ? 'text-gray-600' : 'text-gray-400'
  const primaryColor = theme === 'light' ? 'bg-purple-600' : 'bg-purple-700'
  const primaryHover =
    theme === 'light' ? 'hover:bg-purple-700' : 'hover:bg-purple-800'

  const handleStartGame = () => {
    createSession.mutate(
      {
        data: {},
      },
      {
        onSuccess: response => {
          setSessionId(response.sessionId)
          const questions: Question[] = response.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options || [],
            correctAnswer: 0,
            difficulty: q.difficulty,
          }))
          gameStore.setQuestionsFromAPI(questions)
          gameStore.gameStatus = 'playing'
        },
        onError: error => {
          console.error('Failed to create session:', error)
        },
      },
    )
  }

  const handleNextQuestion = () => {
    if (sessionId && currentQuestion) {
      const hasAnswer =
        selectedAnswers.length > 0 || essayAnswer.trim().length > 0

      if (!hasAnswer) return

      gameStore.saveCurrentAnswer()

      const submissionData: any = {
        questionId: String(currentQuestion.id),
      }

      if (currentQuestion.options && currentQuestion.options.length > 0) {
        submissionData.selectedOptions = selectedAnswers
      } else {
        submissionData.text = essayAnswer
      }

      submitAnswer.mutate(
        {
          sessionId,
          data: submissionData,
        },
        {
          onSuccess: response => {
            if ('pointsEarned' in response) {
              const isCorrect = response.status === 'correct'
              gameStore.updateAnswerResult(
                currentQuestion.id,
                isCorrect,
                response.pointsEarned,
              )
            }
            gameStore.nextQuestion()
            setEssayAnswer('')
          },
          onError: error => {
            console.error('Failed to submit answer:', error)
            gameStore.nextQuestion()
            setEssayAnswer('')
          },
        },
      )
    }
  }

  const handleFinishGame = () => {
    if (sessionId && currentQuestion) {
      const hasAnswer =
        selectedAnswers.length > 0 || essayAnswer.trim().length > 0

      if (!hasAnswer) return

      gameStore.saveCurrentAnswer()

      const submissionData: any = {
        questionId: String(currentQuestion.id),
      }

      if (currentQuestion.options && currentQuestion.options.length > 0) {
        submissionData.selectedOptions = selectedAnswers
      } else {
        submissionData.text = essayAnswer
      }

      submitAnswer.mutate(
        {
          sessionId,
          data: submissionData,
        },
        {
          onSuccess: response => {
            if ('pointsEarned' in response) {
              const isCorrect = response.status === 'correct'
              gameStore.updateAnswerResult(
                currentQuestion.id,
                isCorrect,
                response.pointsEarned,
              )
            }

            submitSession.mutate(
              { sessionId },
              {
                onSuccess: response => {
                  console.log('Session completed:', response)
                  gameStore.finishGame()
                },
                onError: error => {
                  console.error('Failed to submit session:', error)
                  gameStore.finishGame()
                },
              },
            )
          },
          onError: error => {
            console.error('Failed to submit answer:', error)
            submitSession.mutate(
              { sessionId },
              {
                onSuccess: () => gameStore.finishGame(),
                onError: () => gameStore.finishGame(),
              },
            )
          },
        },
      )
    } else if (sessionId) {
      submitSession.mutate(
        { sessionId },
        {
          onSuccess: response => {
            console.log('Session completed:', response)
            gameStore.finishGame()
          },
          onError: error => {
            console.error('Failed to submit session:', error)
            gameStore.finishGame()
          },
        },
      )
    } else {
      gameStore.finishGame()
    }
  }

  if (gameStatus === 'idle') {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${bgGradient} flex items-center justify-center p-4 transition-colors duration-300`}
      >
        <div
          className={`${cardBg} w-full max-w-md rounded-2xl p-8 shadow-2xl transition-colors duration-300`}
        >
          <div className='mb-4 flex justify-end'>
            <button
              onClick={toggleTheme}
              className={`rounded-lg p-2 ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>

          <h1 className={`mb-2 text-center text-4xl font-bold ${textColor}`}>
            Quiz Game
          </h1>
          <p className={`${mutedText} mb-2 text-center`}>
            MobX + Zustand Edition
          </p>
          <p className={`text-sm ${mutedText} mb-8 text-center`}>
            Звук: {soundEnabled ? '🔊' : '🔇'}
          </p>

          <button
            onClick={handleStartGame}
            disabled={createSession.isPending}
            className={`w-full ${primaryColor} ${primaryHover} transform rounded-xl px-6 py-4 font-semibold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {createSession.isPending ? 'Загрузка...' : 'Начать игру'}
          </button>

          <div
            className={`mt-6 rounded-lg p-4 ${theme === 'light' ? 'bg-purple-50' : 'bg-gray-700'}`}
          >
            <p
              className={`text-sm ${theme === 'light' ? 'text-purple-900' : 'text-gray-300'} mb-2`}
            >
              <strong>Task 4:</strong> Комбинация MobX + Zustand
            </p>
            <ul
              className={`text-xs ${theme === 'light' ? 'text-purple-800' : 'text-gray-400'} space-y-1`}
            >
              <li>
                • <strong>MobX:</strong> Игровая логика (вопросы, счёт)
              </li>
              <li>
                • <strong>Zustand:</strong> UI настройки (тема, звук)
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (gameStatus === 'finished') {
    const percentage = Math.round(
      (gameStore.correctAnswersCount / gameStore.questions.length) * 100,
    )
    const getEmoji = () => {
      if (percentage >= 80) return '🏆'
      if (percentage >= 60) return '😊'
      if (percentage >= 40) return '🤔'
      return '😢'
    }

    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${bgGradient} flex items-center justify-center p-4 transition-colors duration-300`}
      >
        <div
          className={`${cardBg} w-full max-w-md rounded-2xl p-8 text-center shadow-2xl transition-colors duration-300`}
        >
          <div className='mb-4 text-6xl'>{getEmoji()}</div>

          <h2 className={`mb-4 text-3xl font-bold ${textColor}`}>
            Игра завершена!
          </h2>

          <div className='mb-6'>
            <p
              className={`text-5xl font-bold ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'} mb-2`}
            >
              {score}
            </p>
            <p className={mutedText}>очков заработано</p>
          </div>

          <div
            className={`${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'} mb-6 rounded-lg p-4`}
          >
            <p className={`text-lg ${textColor}`}>
              Правильных ответов:{' '}
              <span className='font-bold'>
                {gameStore.correctAnswersCount} из {gameStore.questions.length}
              </span>
            </p>
            <p
              className={`mt-2 text-2xl font-bold ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`}
            >
              {percentage}%
            </p>
          </div>

          <button
            onClick={() => gameStore.resetGame()}
            className={`w-full ${primaryColor} ${primaryHover} transform rounded-xl px-6 py-3 font-semibold text-white transition-all hover:scale-105`}
          >
            Играть снова
          </button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${bgGradient} p-4 transition-colors duration-300`}
    >
      <div className='mx-auto max-w-2xl'>
        <div
          className={`${cardBg} mb-4 rounded-lg p-4 shadow-md transition-colors duration-300`}
        >
          <div className='mb-2 flex items-center justify-between'>
            <span className={`text-sm ${mutedText}`}>
              Вопрос {gameStore.currentQuestionIndex + 1} из{' '}
              {gameStore.questions.length}
            </span>
            <div className='flex items-center gap-3'>
              <span
                className={`text-xl font-bold ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`}
              >
                Счёт: {score}
              </span>
              <button
                onClick={toggleTheme}
                className={`rounded p-2 ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
          <div
            className={`w-full ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} h-2 rounded-full`}
          >
            <div
              className={`${theme === 'light' ? 'bg-purple-600' : 'bg-purple-500'} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div
          className={`${cardBg} rounded-2xl p-6 shadow-2xl transition-colors duration-300`}
        >
          <div className='mb-4'>
            <span
              className={`rounded-full px-2 py-1 text-xs ${currentQuestion.difficulty === 'easy' && 'bg-green-100 text-green-700'} ${currentQuestion.difficulty === 'medium' && 'bg-yellow-100 text-yellow-700'} ${currentQuestion.difficulty === 'hard' && 'bg-red-100 text-red-700'} `}
            >
              {currentQuestion.difficulty === 'easy' && 'Легкий'}
              {currentQuestion.difficulty === 'medium' && 'Средний'}
              {currentQuestion.difficulty === 'hard' && 'Сложный'}
            </span>
          </div>

          <h2 className={`mb-6 text-2xl font-bold ${textColor}`}>
            {currentQuestion.question}
          </h2>

          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className='space-y-3'>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers.includes(index)
                const isCorrect = index === currentQuestion.correctAnswer
                const showResult = false

                return (
                  <button
                    key={index}
                    onClick={() => gameStore.toggleAnswer(index)}
                    disabled={submitAnswer.isPending}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${!showResult && theme === 'light' && 'hover:border-purple-400 hover:bg-purple-50'} ${!showResult && theme === 'dark' && 'hover:border-purple-500 hover:bg-gray-700'} ${!showResult && !isSelected && (theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-gray-700')} ${!showResult && isSelected && (theme === 'light' ? 'border-purple-500 bg-purple-50' : 'border-purple-500 bg-gray-600')} ${showResult && isCorrect && 'border-green-500 bg-green-50'} ${showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50'} ${showResult && !isCorrect && !isSelected && 'opacity-60'} `}
                  >
                    <div className='flex items-center'>
                      <span
                        className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full font-semibold ${!isSelected && (theme === 'light' ? 'bg-gray-200' : 'bg-gray-600 text-white')} ${isSelected && (theme === 'light' ? 'bg-purple-500 text-white' : 'bg-purple-400 text-white')} `}
                      >
                        {isSelected ? '✓' : String.fromCharCode(65 + index)}
                      </span>
                      <span className={`flex-1 ${textColor}`}>{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className='space-y-3'>
              <textarea
                value={essayAnswer}
                onChange={e => setEssayAnswer(e.target.value)}
                disabled={submitAnswer.isPending}
                placeholder='Введите ваш ответ здесь...'
                rows={8}
                className={`w-full resize-none rounded-lg border-2 p-4 transition-all ${
                  theme === 'light'
                    ? 'border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:border-purple-500'
                    : 'border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              <div className={`text-sm ${mutedText}`}>
                {essayAnswer.length} символов
              </div>
            </div>
          )}

          {(selectedAnswers.length > 0 || essayAnswer.trim().length > 0) && (
            <button
              onClick={
                gameStore.isLastQuestion ? handleFinishGame : handleNextQuestion
              }
              disabled={submitAnswer.isPending || submitSession.isPending}
              className={`mt-6 w-full ${primaryColor} ${primaryHover} rounded-lg px-6 py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {submitAnswer.isPending || submitSession.isPending
                ? 'Отправка...'
                : gameStore.isLastQuestion
                  ? 'Завершить'
                  : 'Следующий вопрос'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

export default Task4
