"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Comment {
  id: number;
  name: string;
  content: string;
  timestamp: string;
  rating: number;
}

export default function BoardPage() {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      name: "김철수",
      content: "번역 품질이 정말 좋네요! 특히 DeepL 엔진이 훌륭합니다.",
      timestamp: "2024-01-15 14:30",
      rating: 5
    },
    {
      id: 2,
      name: "이영희",
      content: "검증 기능이 있어서 번역 결과를 신뢰할 수 있어요. 매우 유용합니다.",
      timestamp: "2024-01-14 16:45",
      rating: 5
    },
    {
      id: 3,
      name: "박민수",
      content: "UI가 깔끔하고 사용하기 편리합니다. 다만 더 많은 언어를 지원하면 좋겠어요.",
      timestamp: "2024-01-13 11:20",
      rating: 4
    }
  ]);

  const [newComment, setNewComment] = useState({
    name: '',
    content: '',
    rating: 5
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.name.trim() || !newComment.content.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      name: newComment.name,
      content: newComment.content,
      timestamp: new Date().toLocaleString('ko-KR'),
      rating: newComment.rating
    };

    setComments(prev => [comment, ...prev]);
    setNewComment({ name: '', content: '', rating: 5 });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
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
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* 새 댓글 작성 */}
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
                  value={newComment.name}
                  onChange={(e) => setNewComment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  평점
                </label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewComment(prev => ({ ...prev, rating: i + 1 }))}
                      className={`text-2xl ${i < newComment.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {newComment.rating}/5
                  </span>
                </div>
              </div>
            </div>
            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                  제안 내용
                </label>
              <textarea
                value={newComment.content}
                onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
                rows={4}
                placeholder="서비스 개선을 위한 제안을 남겨주세요..."
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                제안 작성
              </button>
            </div>
          </form>
        </div>

        {/* 댓글 목록 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">전체 제안 ({comments.length})</h2>
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {comment.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{comment.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderStars(comment.rating)}
                      </div>
                      <span className="text-sm text-gray-500">{comment.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {comment.content}
              </p>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">아직 제안이 없습니다. 첫 번째 제안을 작성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
} 