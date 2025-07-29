"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Feedback {
  id: string;
  name: string;
  rating: number;
  content: string;
  createdAt: string;
  user?: {
    email: string;
  };
}

export default function BoardPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState({
    name: '',
    rating: 5,
    content: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 피드백 목록 조회
  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/feedback');
      const result = await response.json();
      
      if (result.success) {
        setFeedbacks(result.data);
      } else {
        setError('피드백을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      setError('피드백을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 피드백 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFeedback),
      });

      const result = await response.json();

      if (result.success) {
        // 폼 초기화
        setNewFeedback({
          name: '',
          rating: 5,
          content: ''
        });
        // 피드백 목록 새로고침
        await fetchFeedbacks();
      } else {
        setError(result.error?.message || '피드백 작성에 실패했습니다.');
      }
    } catch (error) {
      setError('피드백 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 별점 표시
  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>뒤로가기</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">개선 제안함</h1>
          </div>
        </div>

        {/* 새 제안 작성 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">새 제안 작성</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={newFeedback.name}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  평점
                </label>
                <select
                  value={newFeedback.rating}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5점)</option>
                  <option value={4}>⭐⭐⭐⭐☆ (4점)</option>
                  <option value={3}>⭐⭐⭐☆☆ (3점)</option>
                  <option value={2}>⭐⭐☆☆☆ (2점)</option>
                  <option value={1}>⭐☆☆☆☆ (1점)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제안 내용
              </label>
              <textarea
                value={newFeedback.content}
                onChange={(e) => setNewFeedback(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
                rows={4}
                placeholder="서비스 개선을 위한 제안을 남겨주세요..."
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                {isSubmitting ? '제안 작성 중...' : '제안 작성'}
              </button>
            </div>
          </form>
        </div>

        {/* 제안 목록 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">전체 제안 ({feedbacks.length})</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">제안을 불러오는 중...</p>
            </div>
          ) : feedbacks.length > 0 ? (
            feedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{feedback.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(feedback.createdAt)}
                      {feedback.user && ` • ${feedback.user.email}`}
                    </p>
                  </div>
                  <div className="text-yellow-500 text-lg">
                    {renderStars(feedback.rating)}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{feedback.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">아직 제안이 없습니다. 첫 번째 제안을 작성해보세요!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 