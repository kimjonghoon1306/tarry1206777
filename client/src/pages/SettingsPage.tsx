import React from 'react';
import { Lock } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">설정</h1>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={18} />
          <span className="font-semibold">보안 설정</span>
        </div>

        <p className="text-sm text-gray-500">
          API 키 및 보안 관련 설정을 관리합니다.
        </p>
      </div>
    </div>
  );
}
