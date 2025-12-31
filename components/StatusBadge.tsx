
import React from 'react';
import { CareStatus } from '../types';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  // Map generic or specific statuses
  // Fix: Aligned with CareStatus enum values
  const styles: Record<string, string> = {
    [CareStatus.REQUESTED]: 'bg-amber-100 text-amber-800',
    [CareStatus.SIGNED]: 'bg-green-100 text-green-800',
    [CareStatus.CANCELLED]: 'bg-red-100 text-red-800',
    // Legacy fallback
    'DRAFT': 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    [CareStatus.REQUESTED]: '서명 대기',
    [CareStatus.SIGNED]: '완료됨',
    [CareStatus.CANCELLED]: '취소됨',
    // Legacy fallback
    'DRAFT': '작성 중',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
};
