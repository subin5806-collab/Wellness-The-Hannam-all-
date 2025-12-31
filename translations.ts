
export const translations = {
  ko: {
    portal: {
      title: "WELLNESS, THE HANNAM",
      subtitle: "컨시어지 서비스",
      tabs: {
        home: "포털",
        ledger: "내역",
        insights: "인사이트"
      },
      home: {
        pendingTitle: "차감 확인 대기",
        pendingSubtitle: "디지털 서명이 필요합니다",
        service: "서비스",
        amount: "금액",
        authorize: "결제 승인하기",
        verifying: "인증 중...",
        remaining: "잔여 크레딧",
        totalDeposit: "총 충전액",
        totalUsage: "총 사용액",
        upcoming: "예정된 세션",
        noSchedule: "예정된 예약이 없습니다",
        signHere: "서명을 위해 이곳에 터치하세요"
      },
      history: {
        title: "이용 장부",
        completed: "완료됨",
        waiting: "서명 대기",
        cancelled: "취소됨"
      },
      insights: {
        title: "웰니스 인사이트",
        recap: "세션 리캡",
        strategy: "추천 전략",
        noData: "이용 내역이 없습니다",
        expert: "전담 큐레이터"
      },
      common: {
        logout: "로그아웃 하시겠습니까?",
        confirm: "확인"
      }
    }
  },
  en: {
    portal: {
      title: "WELLNESS, THE HANNAM",
      subtitle: "Concierge Service",
      tabs: {
        home: "Portal",
        ledger: "Ledger",
        insights: "Insights"
      },
      home: {
        pendingTitle: "Deduction Confirmation",
        pendingSubtitle: "Digital signature required",
        service: "Service",
        amount: "Amount",
        authorize: "Authorize Transaction",
        verifying: "Verifying...",
        remaining: "Remaining Credit",
        totalDeposit: "Total Deposit",
        totalUsage: "Total Usage",
        upcoming: "Upcoming Session",
        noSchedule: "No scheduled bookings",
        signHere: "Touch here to sign"
      },
      history: {
        title: "Usage Ledger",
        completed: "Completed",
        waiting: "Pending",
        cancelled: "Cancelled"
      },
      insights: {
        title: "Wellness Insights",
        recap: "Session Recap",
        strategy: "Recommendation Strategy",
        noData: "No insights available",
        expert: "Expert Curator"
      },
      common: {
        logout: "Log out?",
        confirm: "Confirm"
      }
    }
  }
};

export type Language = 'ko' | 'en';
