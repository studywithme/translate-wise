"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ApiKey {
  id: string;
  key: string;
  revoked: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export default function MyPage() {
  const { user, token } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // API 키 목록 조회
  const fetchKeys = async () => {
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setApiKeys(data.data.apiKeys);
      } else {
        setMessage('API 키 목록 조회 실패');
      }
    } catch {
      setMessage('API 키 목록 조회 실패');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
    // eslint-disable-next-line
  }, [token]);

  // API 키 발급
  const handleIssue = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/v1/auth/apikey', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('API 키 발급 성공!');
        fetchKeys();
      } else {
        setMessage(data.error || 'API 키 발급 실패');
      }
    } catch {
      setMessage('API 키 발급 실패');
    }
    setLoading(false);
  };

  // API 키 폐기
  const handleRevoke = async (key: string) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/v1/auth/apikey/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('API 키 폐기 성공!');
        fetchKeys();
      } else {
        setMessage(data.error || 'API 키 폐기 실패');
      }
    } catch {
      setMessage('API 키 폐기 실패');
    }
    setLoading(false);
  };

  // API 키 재발급
  const handleRefresh = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/v1/auth/apikey/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('API 키 재발급 성공!');
        fetchKeys();
      } else {
        setMessage(data.error || 'API 키 재발급 실패');
      }
    } catch {
      setMessage('API 키 재발급 실패');
    }
    setLoading(false);
  };

  // 복사 버튼
  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setMessage('API 키가 복사되었습니다!');
  };

  if (!user) {
    return <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded shadow text-center">로그인 후 이용 가능합니다.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">마이페이지</h2>
      <div className="mb-4">
        <div><b>이메일:</b> {user.email}</div>
        <div><b>가입일:</b> {user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</div>
      </div>
      <div className="mb-4 flex gap-2">
        <button onClick={handleIssue} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">API 키 발급</button>
        <button onClick={handleRefresh} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400">재발급</button>
      </div>
      <div className="mb-2 font-semibold">내 API 키 목록</div>
      {loading ? <div>로딩 중...</div> : null}
      {message && <div className="mb-2 text-blue-600 text-sm">{message}</div>}
      <ul className="space-y-2">
        {apiKeys.length === 0 && <li className="text-gray-500">API 키가 없습니다.</li>}
        {apiKeys.map(k => (
          <li key={k.id} className="flex items-center gap-2 border p-2 rounded">
            <span className={`font-mono text-xs px-2 py-1 rounded bg-white text-gray-900 ${k.revoked ? 'line-through opacity-60' : ''}`}>{k.key}</span>
            <button onClick={() => handleCopy(k.key)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">복사</button>
            {!k.revoked && <button onClick={() => handleRevoke(k.key)} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">폐기</button>}
            {k.revoked && <span className="text-xs text-red-400">(폐기됨)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
} 