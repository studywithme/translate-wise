"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const ok = await register(email, password);
    if (ok) {
      setMessage('회원가입 성공! 로그인 해주세요.');
    } else {
      setMessage('회원가입 실패. 이미 가입된 이메일이거나 서버 오류입니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-900 rounded shadow dark:text-gray-100">
      <h2 className="text-2xl font-bold mb-6">회원가입</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>
      {message && <div className="mt-4 text-center text-sm text-blue-600">{message}</div>}
      <div className="mt-4 text-center text-sm">
        이미 계정이 있으신가요?{' '}
        <Link href="/auth/login" className="text-blue-600 hover:underline">로그인</Link>
      </div>
    </div>
  );
} 