import { makeAutoObservable, runInAction } from "mobx";
import type { QuestionPreview } from "../../generated/api/quizBattleAPI.schemas";
import { mockQuestions } from "../data/questions";


export interface LocalQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LocalAnswer {
  questionId: string;
  selectedAnswers: number[];
  isCorrect: boolean;
  pointsEarned: number;
}

export class GameStore {
  gameStatus: "idle" | "playing" | "finished" = "idle";
  questions: LocalQuestion[] = [];
  currentQuestionIndex = 0;
  score = 0;
  selectedAnswers: number[] = [];
  answeredQuestions: LocalAnswer[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  // Преобразование вопросов из API формата во внутренний
  setQuestionsFromAPI(questions: QuestionPreview[]) {

    this.questions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      correctAnswers: [],
      difficulty: q.difficulty
    }));

    this.currentQuestionIndex = 0;
    this.selectedAnswers = [];
    this.answeredQuestions = [];
    this.score = 0;
  }


  startGame() {
    this.gameStatus = "playing";

    if (this.questions.length === 0) {
      this.questions = mockQuestions;
    }
    this.currentQuestionIndex = 0;
    this.selectedAnswers = [];
    this.answeredQuestions = [];
    this.score = 0;
  }


  toggleAnswer(index: number) {
    if (this.gameStatus !== "playing") return;

    if (this.selectedAnswers.includes(index)) {
      this.selectedAnswers = this.selectedAnswers.filter(i => i !== index);
    } else {
      this.selectedAnswers = [...this.selectedAnswers, index];
    }
  }


  saveCurrentAnswer() {
    const question = this.currentQuestion;
    if (!question || this.selectedAnswers.length === 0) return;


    this.answeredQuestions = this.answeredQuestions.filter(
      a => a.questionId !== question.id
    );

    this.answeredQuestions.push({
      questionId: question.id,
      selectedAnswers: [...this.selectedAnswers],
      isCorrect: false,
      pointsEarned: 0
    });
  }


  forceSaveCurrentAnswer() {

    const question = this.currentQuestion;
    if (!question) {
      console.log('❌ No current question');
      return;
    }

    if (this.selectedAnswers.length === 0) {
      console.log('❌ No selected answers');
      return;
    }

    if (!question) return;


    const alreadyAnswered = this.answeredQuestions.some(a => a.questionId === question.id);

    if (!alreadyAnswered && this.selectedAnswers.length > 0) {
      this.answeredQuestions.push({
        questionId: question.id,
        selectedAnswers: [...this.selectedAnswers],
        isCorrect: false,
        pointsEarned: 0
      });

    }
  }

  updateAnswerResult(questionId: string, isCorrect: boolean, pointsEarned: number) {

    const answerIndex = this.answeredQuestions.findIndex(a => a.questionId === questionId);
    console.log('Found answer at index:', answerIndex);

    if (answerIndex !== -1) {
      this.answeredQuestions[answerIndex].isCorrect = isCorrect;
      this.answeredQuestions[answerIndex].pointsEarned = pointsEarned;

      if (isCorrect) {
        this.score += pointsEarned;
      }
    } else {
      console.log('❌ Answer not found for question:', questionId);
    }
  }

  updateScoreFromServer(newScore: number) {
    runInAction(() => {
      this.score = newScore;
    });
  }


  updateAnswerStatusFromServer(questionId: string, isCorrect: boolean, pointsEarned: number) {
    const answerIndex = this.answeredQuestions.findIndex(a => a.questionId === questionId);
  }


  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswers = [];
    } else {
      this.finishGame();
    }
  }

  finishGame() {
    this.gameStatus = "finished";
  }

  resetGame() {
    this.gameStatus = "idle";
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.selectedAnswers = [];
    this.answeredQuestions = [];
  }


  get currentQuestion(): LocalQuestion | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get progress(): number {
    return this.questions.length
      ? ((this.currentQuestionIndex + 1) / this.questions.length) * 100
      : 0;
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  get correctAnswersCount(): number {
    const count = this.answeredQuestions.filter(a => a.isCorrect).length;
    console.log('Correct answers computed:', count, 'from', this.answeredQuestions.length);
    return count;
  }

  get isAnswerSelected(): boolean {
    return this.selectedAnswers.length > 0;
  }
}


export const gameStore = new GameStore();