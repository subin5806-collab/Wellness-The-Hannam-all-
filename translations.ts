
export const translations = {
  ko: {
    portal: {
      title: "Wellness, The Hannam",
      subtitle: "프라이빗 컨시어지",
      tabs: {
        home: "포털 홈",
        ledger: "이용 내역",
        insights: "웰니스 리포트"
      },
      home: {
        welcome: "반갑습니다,",
        pendingTitle: "서비스 확인 대기",
        pendingSubtitle: "전자 서명이 필요합니다",
        service: "서비스 명",
        amount: "금액",
        authorize: "확인 및 서명하기",
        verifying: "인증 처리 중...",
        remaining: "잔여 크레딧",
        totalDeposit: "총 충전액",
        totalUsage: "누적 사용액",
        upcoming: "예정된 예약",
        noSchedule: "예정된 예약이 없습니다",
        signHere: "이곳에 서명해 주세요",
        tier: "회원 등급",
        expiry: "멤버십 만료일"
      },
      history: {
        title: "통합 이용 장부",
        completed: "결제 완료",
        waiting: "서명 대기",
        cancelled: "취소됨",
        date: "이용 일시",
        program: "프로그램",
        deduction: "차감액"
      },
      insights: {
        title: "웰니스 케어 노트",
        recap: "오늘의 테라피 리캡",
        strategy: "다음 세션 추천",
        noData: "기록된 노트가 없습니다",
        expert: "전담 전문가"
      },
      common: {
        logout: "로그아웃 하시겠습니까?",
        confirm: "확인",
        close: "닫기"
      }
    }
  },
  en: {
    portal: {
      title: "Wellness, The Hannam",
      subtitle: "Private Concierge",
      tabs: {
        home: "Portal Home",
        ledger: "Usage Ledger",
        insights: "Wellness Report"
      },
      home: {
        welcome: "Welcome,",
        pendingTitle: "Deduction Approval",
        pendingSubtitle: "Digital signature required",
        service: "Service",
        amount: "Amount",
        authorize: "Verify & Sign",
        verifying: "Verifying...",
        remaining: "Remaining Credit",
        totalDeposit: "Total Deposit",
        totalUsage: "Total Usage",
        upcoming: "Upcoming Sessions",
        noSchedule: "No scheduled bookings",
        signHere: "Please sign here",
        tier: "Membership Tier",
        expiry: "Expiry Date"
      },
      history: {
        title: "Integrated Ledger",
        completed: "Completed",
        waiting: "Pending",
        cancelled: "Cancelled",
        date: "Date",
        program: "Program",
        deduction: "Amount"
      },
      insights: {
        title: "Wellness Care Notes",
        recap: "Today's Therapy Recap",
        strategy: "Next Recommendation",
        noData: "No insights available",
        expert: "Expert Curator"
      },
      common: {
        logout: "Log out from portal?",
        confirm: "Confirm",
        close: "Close"
      }
    }
  }
};

export type Language = 'ko' | 'en';
