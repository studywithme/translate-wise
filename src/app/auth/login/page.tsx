"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const ok = await login(email, password);
    if (ok) {
      setMessage('로그인 성공!');
      setTimeout(() => router.push('/'), 1000);
    } else {
      setMessage('로그인 실패. 이메일 또는 비밀번호를 확인하세요.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-900 rounded shadow dark:text-gray-100">
      <h2 className="text-2xl font-bold mb-6">로그인</h2>
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
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      {message && <div className="mt-4 text-center text-sm text-blue-600">{message}</div>}
      <div className="mt-4 text-center text-sm">
        계정이 없으신가요?{' '}
        <Link href="/auth/register" className="text-blue-600 hover:underline">회원가입</Link>
      </div>
    </div>
  );
} 