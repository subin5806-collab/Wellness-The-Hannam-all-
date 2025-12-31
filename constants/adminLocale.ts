
export const ADMIN_UI = {
  navigation: {
    dashboard: "운영 현황",
    reservations: "예약 관리",
    members: "회원 관리",
    contracts: "계약 관리",
    inquiries: "상담 관리"
  },
  dashboard: {
    title: "운영 대시보드",
    subtitle: "더 한남 통합 관리 콘솔",
    stats: {
      bookingToday: "오늘의 예약",
      awaitingSign: "서명 대기",
      unprocessedInquiry: "미처리 문의",
      lowBalance: "잔액 부족 회원"
    },
    schedule: {
      title: "오늘의 예약 일정",
      viewAll: "전체 보기",
      noData: "오늘 예정된 예약이 없습니다."
    },
    portfolio: {
      title: "멤버십 프로그램 구성",
      newPlan: "신규 프로그램 등록"
    }
  },
  members: {
    title: "회원 명부",
    subtitle: "프라이빗 클라이언트 아카이브",
    actions: {
      csv: "CSV 내보내기",
      backup: "전체 백업",
      bulk: "일괄 등록",
      register: "신규 회원 등록"
    },
    table: {
      identity: "회원 정보",
      contact: "연락처",
      membership: "등급",
      balance: "잔액 정보"
    },
    filters: {
      searchPlaceholder: "이름, 연락처, 이메일로 검색...",
      allTiers: "전체 등급"
    }
  },
  contracts: {
    title: "전자 계약 관리",
    subtitle: "디지털 아카이브 및 템플릿",
    newContract: "신규 계약서 작성",
    tabs: {
      inbox: "계약서 보관함",
      forms: "템플릿 관리"
    },
    table: {
      info: "회원 정보 / 문서명",
      type: "계약 유형",
      amount: "계약 금액",
      actions: "관리"
    }
  },
  inquiries: {
    title: "상담 및 리드 관리",
    subtitle: "통합 고객 유입 콘솔",
    newInquiry: "신규 문의 접수",
    stats: {
      conversion: "이번달 전환율",
      followUp: "재컨택 대상",
      inProgress: "상담 중",
      unregistered: "미등록 리드"
    },
    status: {
      UNREGISTERED: "미등록",
      IN_PROGRESS: "상담중",
      REGISTERED: "등록완료",
      COMPLETED: "종결"
    }
  },
  common: {
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    edit: "수정",
    confirm: "확인",
    back: "뒤로가기",
    loading: "데이터를 불러오는 중...",
    processing: "처리 중입니다..."
  }
};
