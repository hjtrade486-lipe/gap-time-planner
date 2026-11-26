(function () {
  'use strict';

  /* ==================== CONSTANTS & METADATA ==================== */
  const STORAGE_KEY_SCHEDULES = 'gaptime_schedules_v1';
  const STORAGE_KEY_ACTIVE_ID = 'gaptime_active_id_v1';
  const STORAGE_KEY_TIMER = 'gaptime_timer_v1';
  const STORAGE_KEY_DRAFT = 'gaptime_input_draft_v1';
  const STORAGE_KEY_VIEW = 'gaptime_active_view_v1';

  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const PRIORITY_WEIGHTS = [5, 3, 2, 1, 1, 1];

  const CATEGORIES = {
    '공부': {
      key: 'study',
      emoji: '📘',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      desc: '전공 복습·영어·문제 풀이'
    },
    '과제': {
      key: 'assignment',
      emoji: '📝',
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      desc: '자료 정리·보고서·제출 점검'
    },
    '운동': {
      key: 'exercise',
      emoji: '🏃',
      color: '#16A34A',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      desc: '스트레칭·걷기·러닝·헬스'
    },
    '식사': {
      key: 'meal',
      emoji: '🍱',
      color: '#EA580C',
      bg: '#FFF7ED',
      border: '#FED7AA',
      desc: '식사 확보·이동 및 정리'
    },
    '휴식': {
      key: 'rest',
      emoji: '☕',
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#99F6E4',
      desc: '낮잠·음악·산책·리프레시'
    },
    '개인 용무': {
      key: 'errand',
      emoji: '🧾',
      color: '#475569',
      bg: '#F1F5F9',
      border: '#CBD5E1',
      desc: '은행·인쇄·도서 반납·구매'
    },
    '이동 및 준비': {
      key: 'prep',
      emoji: '🚶',
      color: '#78716C',
      bg: '#F5F5F4',
      border: '#D6D3D1',
      desc: '장소 이동·정리·다음 수업 준비'
    }
  };

  const GOAL_LIST = ['공부', '과제', '운동', '식사', '휴식', '개인 용무'];

  /* Rich Activity Templates keyed by Goal -> Location -> Condition (or fallback) */
  const ACTIVITY_TEMPLATES = {
    '공부': {
      '학교': {
        '매우 피곤함': [
          { title: '강의 슬라이드 가볍게 훑어보기', reason: '피곤할 때는 새 진도보다 도서관이나 빈 강의실에서 가벼운 복습이 부담 없이 기억에 남아요.' },
          { title: '핵심 키워드 노트 요약 정리', reason: '긴 문제 풀이 대신 핵심 용어만 빠르게 짚어 집중력을 아끼며 복습해요.' },
          { title: '오답 노트·기출 포인트 가볍게 확인', reason: '컨디션이 낮을 때도 짧게 성취감을 얻기 좋은 학교 내 복습 루틴이에요.' }
        ],
        '보통': [
          { title: '도서관 전공 강의 핵심 복습', reason: '학교 도서관의 차분한 분위기 속에서 방금 들은 수업 내용을 바로 정리하면 기억 효율이 높아요.' },
          { title: '영어 단어·회화 표현 집중 암기', reason: '공강시간을 활용해 매일 조금씩 어학 감각을 끌어올리기 좋아요.' },
          { title: '전공 교재 예제 및 문제 풀이', reason: '안정적인 컨디션일 때 직접 손을 움직여 문제를 풀면 실전 감각이 빠르게 붙어요.' }
        ],
        '활기참': [
          { title: '고난도 전공 연습문제 집중 풀이', reason: '활기찬 컨디션과 학교 학습 공간을 살려 가장 집중력이 필요한 문제를 돌파해 보세요.' },
          { title: '시험 대비 핵심 단원 심화 정리', reason: '에너지가 충분할 때 어려운 개념을 구조화해 두면 시험 기간이 훨씬 편해져요.' },
          { title: '외국어·전공 모의 테스트 타임어택', reason: '높은 집중력을 발휘해 제한 시간 내 실력을 점검하기 딱 좋아요.' }
        ]
      },
      '집': {
        '매우 피곤함': [
          { title: '편안한 자세로 강의 녹음·필기 가볍게 복습', reason: '집의 편안한 환경에서 무리하지 않고 핵심 흐름만 다시 떠올려요.' },
          { title: '짧은 플래시카드·단어 가볍게 훑기', reason: '피로감을 줄이면서 오늘의 학습 루틴을 놓치지 않는 가벼운 활동이에요.' }
        ],
        '보통': [
          { title: '책상에서 전공 수업 내용 체계적 복습', reason: '조용한 집 책상에서 방해 없이 오늘 배운 내용을 정리하기 좋아요.' },
          { title: '온라인 강의 보충 및 요약 노트 작성', reason: '집중하기 좋은 집 환경에서 밀린 강의를 차분히 따라잡아요.' }
        ],
        '활기참': [
          { title: '시험 대비 핵심 파트 몰입 학습', reason: '집에서의 높은 집중력과 활기찬 컨디션을 결합해 깊이 있는 공부를 진행해요.' },
          { title: '전공 문제집 1챕터 완주 풀이', reason: '외부 소음 없는 환경에서 에너지 있게 한 단원을 끝낼 수 있어요.' }
        ]
      },
      '이동 중': {
        '매우 피곤함': [
          { title: '이어폰으로 짧은 강의 오디오·팟캐스트 청취', reason: '이동 중 피곤할 때는 화면을 오래 보지 않고 눈을 쉬며 귀로 듣는 방식이 가장 안전하고 편해요.' },
          { title: '오늘 배운 핵심 3줄 머릿속으로 되새기기', reason: '대중교통 이동 중 눈의 피로 없이 가볍게 기억을 정리할 수 있어요.' }
        ],
        '보통': [
          { title: '대중교통에서 요약 강의 자료 훑어보기', reason: '대중교통 이용 중 짧게 핵심 슬라이드나 암기 카드를 확인하기 알맞아요. (운전 시에는 청취로 대체하세요)' },
          { title: '어학 리스닝·단어 음성 복습', reason: '이동 시간을 알차게 쓰면서도 안전하게 학습할 수 있는 오디오 중심 활동이에요.' }
        ],
        '활기참': [
          { title: '대중교통 내 모바일 퀴즈·단어 테스트', reason: '컨디션이 좋을 때 대중교통에서 짧은 퀴즈로 학습 리듬을 유지해 보세요. (보행·운전 중 조작 금지)' },
          { title: '핵심 요약 PDF 정독 및 체크 (대중교통 착석 시)', reason: '자리에서 안정적으로 이동 중이라면 다음 수업 예습 자료를 미리 읽어두면 좋아요.' }
        ]
      }
    },
    '과제': {
      '학교': {
        '매우 피곤함': [
          { title: '과제 요구사항 체크 및 참고 자료 폴더 정리', reason: '피곤할 때는 바로 글을 쓰기보다 과제 틀과 자료를 정리해 두면 다음 작업이 훨씬 수월해져요.' },
          { title: '제출물 오탈자·파일 형식 최종 점검', reason: '적은 에너지로도 실수를 방지할 수 있는 마무리 과제 작업이에요.' }
        ],
        '보통': [
          { title: '과제 목차 구성 및 본문 초안 작성', reason: '학교에서 수업 기억이 생생할 때 과제의 뼈대와 초안을 잡아두면 완성 속도가 빨라져요.' },
          { title: '학술 자료 검색 및 인용 출처 정리', reason: '교내 네트워크와 도서관 자료를 활용해 과제의 근거 자료를 빠르게 모아요.' }
        ],
        '활기참': [
          { title: '보고서·발표 자료 핵심 파트 집중 완성', reason: '에너지가 넘칠 때 가장 품이 많이 드는 본론 작성이나 슬라이드 제작을 한 번에 밀어붙여요.' },
          { title: '팀 프로젝트 담당 분량 몰입 구현 및 점검', reason: '활기찬 컨디션을 살려 완성도 높은 결과물을 빠르게 만들어 내기 좋아요.' }
        ]
      },
      '집': {
        '매우 피곤함': [
          { title: '과제 체크리스트 작성 및 자료 북마크 정리', reason: '집에서 쉬면서 부담 없이 과제 진행 단계를 나누고 준비해 둬요.' },
          { title: '작성한 과제 문단 다듬기 및 제출 점검', reason: '무리한 신규 작성보다 가벼운 교정으로 마감 안정감을 높여요.' }
        ],
        '보통': [
          { title: '집중 환경에서 과제 보고서 초안 작성', reason: '집 책상에서 필요한 도구를 모두 펼치고 차분하게 과제를 진전시켜요.' },
          { title: '참고 문헌 정리 및 도표·이미지 삽입', reason: '꼼꼼한 손길이 필요한 과제 편집 작업을 안정적으로 처리하기 좋아요.' }
        ],
        '활기참': [
          { title: '과제 본문 완결 및 제출 전 최종 검수', reason: '집중력이 최고조인 집 환경에서 과제 마감을 깔끔하게 끝내버릴 수 있어요.' },
          { title: '발표 대본·슬라이드 고품질 디자인 마무리', reason: '활기찬 컨디션으로 시각 자료와 발표 흐름까지 완성도를 끌어올려요.' }
        ]
      },
      '이동 중': {
        '매우 피곤함': [
          { title: '음성 메모로 과제 아이디어 키워드만 기록', reason: '이동 중 피로할 때는 길게 타이핑하지 않고 짧은 음성이나 핵심 단어만 남겨 안전을 지켜요.' }
        ],
        '보통': [
          { title: '대중교통에서 과제 개요·발표 흐름 구상', reason: '대중교통 이용 중 머릿속으로 보고서 구조나 발표 멘트를 정리해 두면 도착 후 바로 쓸 수 있어요.' },
          { title: '과제 참고 자료 목록 확인 및 체크리스트 점검', reason: '화면 조작을 최소화하면서 필요한 자료가 무엇인지 파악하기 좋아요.' }
        ],
        '활기참': [
          { title: '대중교통 착석 상태에서 과제 소제목·개요 메모', reason: '안정적인 대중교통 환경에서 과제 뼈대를 잡아두면 목적지 도착 즉시 본문 작성에 들어갈 수 있어요.' }
        ]
      }
    },
    '운동': {
      '학교': {
        '매우 피곤함': [
          { title: '캠퍼스 잔디·산책로 천천히 걷기 & 목·어깨 스트레칭', reason: '매우 피곤할 때는 격한 운동보다 가벼운 산책과 뭉친 근육 이완이 피로 해소에 좋아요.' }
        ],
        '보통': [
          { title: '캠퍼스 빠른 걸음 워킹 & 전신 스트레칭', reason: '장시간 수업으로 굳은 몸을 적당한 강도로 풀어 다음 수업 집중력을 높여줘요.' },
          { title: '교내 트랙·운동장 가벼운 조깅 및 쿨다운', reason: '학교 시설을 활용해 땀을 살짝 내며 활력을 끌어올리기 좋아요.' }
        ],
        '활기참': [
          { title: '교내 헬스장·체육시설 근력 및 유산소 루틴', reason: '활기찬 컨디션에 맞춰 교내 운동시설에서 제대로 체력을 단련해 보세요.' },
          { title: '교내 러닝 코스 페이스 러닝 & 코어 운동', reason: '에너지가 충분할 때 심폐지구력을 키우는 적극적인 운동이 잘 어울려요.' }
        ]
      },
      '집': {
        '매우 피곤함': [
          { title: '요가 매트 위 가벼운 전신 이완 스트레칭', reason: '집에서 편안하게 누워 허리와 다리 피로를 풀어주는 저강도 회복 루틴이에요.' }
        ],
        '보통': [
          { title: '홈트레이닝 스트레칭 + 기본 코어 루틴', reason: '집에서 별도 장비 없이 적당한 땀을 내며 몸의 균형을 잡기 좋아요.' },
          { title: '집 주변 공원·동네 가벼운 산책', reason: '실내 공기를 환기하고 햇빛을 쬐며 기분 전환까지 챙겨요.' }
        ],
        '활기참': [
          { title: '고강도 홈트(스쿼트·플랭크·버피) 집중 세트', reason: '집에서 눈치 보지 않고 활기찬 에너지를 온전히 쏟아낼 수 있어요.' },
          { title: '동네 러닝 코스 달리기 및 마무리 스트레칭', reason: '컨디션이 최상일 때 야외 러닝으로 상쾌한 성취감을 얻어 보세요.' }
        ]
      },
      '이동 중': {
        '매우 피곤함': [
          { title: '하차 후 서두르지 않고 바른 자세로 가볍게 걷기', reason: '이동 중에는 무리한 운동 대신 호흡을 고르고 바른 자세로 천천히 걷는 것이 안전해요.' }
        ],
        '보통': [
          { title: '한 정거장 먼저 내려 활기차게 도보 이동', reason: '이동 동선 자체를 가벼운 유산소 운동으로 바꾸는 똑똑한 공강 활용법이에요.' }
        ],
        '활기참': [
          { title: '도보 구간 파워 워킹 & 도착 후 전신 스트레칭', reason: '이동 동선 중 안전한 보행 구간에서 빠른 걸음으로 운동 효과를 챙겨보세요.' }
        ]
      }
    },
    '식사': {
      '학교': {
        '매우 피곤함': [
          { title: '학식·교내 식당에서 따뜻하고 소화가 잘되는 식사', reason: '피곤할 때는 멀리 이동하지 않고 가까운 교내 식당에서 든든히 챙겨 먹는 게 최고예요.' }
        ],
        '보통': [
          { title: '교내 식당 또는 학교 앞 맛집 균형 잡힌 식사', reason: '오후 일정을 버틸 에너지를 보충하고 식사 후 가볍게 정리할 시간까지 확보해요.' }
        ],
        '활기참': [
          { title: '영양 균형 맞춘 든든한 식사 & 식후 짧은 산책', reason: '든든하게 식사를 해결하고 다음 일정으로 깔끔하게 이어갈 수 있도록 구성했어요.' }
        ]
      },
      '집': {
        '매우 피곤함': [
          { title: '간편하고 따뜻한 집밥·건강식 식사 및 정리', reason: '조리 부담이 적은 메뉴로 빠르게 체력을 보충하고 설거지까지 가볍게 마쳐요.' }
        ],
        '보통': [
          { title: '집에서 직접 챙기는 균형 잡힌 식사 & 정리', reason: '집의 여유를 살려 편안하게 식사하고 뒷정리까지 깔끔하게 끝내요.' }
        ],
        '활기참': [
          { title: '단백질·채소 챙긴 건강 요리 & 깔끔한 정리', reason: '활기찬 에너지를 바탕으로 맛과 영양을 모두 잡은 식사를 만들어 보세요.' }
        ]
      },
      '이동 중': {
        '매우 피곤함': [
          { title: '이동 경로 내 매장에서 따뜻한 간편식·음료 챙기기', reason: '이동 중 무리하지 않고 잠시 앉아 속을 편하게 채울 수 있는 안전한 식사 시간이에요.' }
        ],
        '보통': [
          { title: '역·정류장 인근에서 균형 잡힌 간단 식사', reason: '동선 손실 없이 다음 장소로 넘어가기 전에 에너지를 알맞게 보충해요.' }
        ],
        '활기참': [
          { title: '경로상 맛집·베이커리에서 든든한 식사 및 이동 준비', reason: '이동 동선 안에 있는 식사 스팟을 활용해 시간 낭비 없이 식사를 해결해요.' }
        ]
      }
    },
    '휴식': {
      '학교': {
        '매우 피곤함': [
          { title: '교내 휴게공간·라운지 파워 낮잠 및 눈 휴식', reason: '피곤함이 누적됐을 때는 15~30분 짧은 낮잠과 눈 감기 휴식이 이후 집중력을 극적으로 살려줘요.' },
          { title: '잔잔한 음악 감상하며 카페에서 멍 때리기', reason: '머리를 비우고 뇌에 잠깐의 쉼표를 주는 회복 시간이에요.' }
        ],
        '보통': [
          { title: '캠퍼스 벤치 산책 & 좋아하는 음악 감상', reason: '햇빛 아래 잠시 걸으며 시각과 정신적 피로를 산뜻하게 전환해요.' },
          { title: '따뜻한 음료 한 잔과 가벼운 휴식', reason: '수업과 다음 일정 사이에 여유를 두어 컨디션을 일정하게 유지해요.' }
        ],
        '활기참': [
          { title: '캠퍼스 내 좋아하는 플레이리스트 감상 & 여유 타임', reason: '컨디션이 좋을 때도 짧은 리프레시 시간을 넣으면 하루 끝까지 지치지 않아요.' }
        ]
      },
      '집': {
        '매우 피곤함': [
          { title: '알람 맞춘 꿀잠 낮잠 및 기분 전환 샤워·휴식', reason: '집이라는 최고의 휴식 공간에서 가장 효과적으로 피로를 씻어내는 시간이에요.' },
          { title: '침대·소파에서 눈 감고 명상 & 잔잔한 음악', reason: '스크린에서 벗어나 눈과 몸을 완전히 쉬게 해줘요.' }
        ],
        '보통': [
          { title: '좋아하는 음악·웹툰·커피와 함께하는 여유 휴식', reason: '집에서 편안하게 기분을 환기하며 다음 일정을 준비해요.' }
        ],
        '활기참': [
          { title: '잠깐의 티타임 및 창밖 보며 가벼운 리프레시', reason: '에너지가 높을 때 페이스 조절을 위한 산뜻한 휴식을 배치했어요.' }
        ]
      },
      '이동 중': {
        '매우 피곤함': [
          { title: '대중교통 좌석에서 눈 감고 잔잔한 음악·ASMR 듣기', reason: '이동 중 가장 안전하고 효과적으로 눈과 뇌의 피로를 덜어주는 휴식 방법이에요.' }
        ],
        '보통': [
          { title: '창밖 풍경 보며 좋아하는 플레이리스트 감상', reason: '스마트폰 화면을 내려놓고 이동 시간을 기분 좋은 쉼표로 바꿔보세요.' }
        ],
        '활기참': [
          { title: '좋아하는 라디오·오디오 콘텐츠 들으며 리프레시', reason: '시야를 방해하지 않는 청각 휴식으로 안전과 여유를 동시에 챙겨요.' }
        ]
      }
    },
    '개인 용무': {
      '학교': {
        '매우 피곤함': [
          { title: '교내 무인 출력기 인쇄·도서관 반납 간단 처리', reason: '학교 안에서 동선 낭비 없이 금방 끝낼 수 있는 필수 용무만 깔끔히 처리해요.' }
        ],
        '보통': [
          { title: '교내 은행·행정실 용무 및 강의자료 인쇄', reason: '수업 시간에는 처리하기 힘든 캠퍼스 내 행정·인쇄·도서 대출을 공강에 해결해요.' },
          { title: '교내 매점·서점에서 필요한 학용품·생필품 구매', reason: '이동 거리를 최소화하면서 미뤄둔 필요한 물품을 챙겨요.' }
        ],
        '활기참': [
          { title: '은행 업무 + 도서 대출/반납 + 인쇄 한 번에 클리어', reason: '활기찬 에너지를 발휘해 밀린 교내 개인 용무를 빠르게 연속 처리해요.' }
        ]
      },
      '집': {
        '매우 피곤함': [
          { title: '모바일 뱅킹·필수 신청서 온라인 간단 처리', reason: '외출하지 않고 집에서 꼭 필요한 금융·행정 일만 손쉽게 끝내요.' }
        ],
        '보통': [
          { title: '방·책상 간단 정돈 및 온라인 생필품 주문', reason: '생활 환경을 정돈하고 필요한 물품을 주문해 다음 주를 편하게 준비해요.' },
          { title: '근처 은행·우체국·편의점 택배 등 생활 용무', reason: '집 근처에서 처리해야 할 개인 용무를 깔끔하게 해결해요.' }
        ],
        '활기참': [
          { title: '책상 대청소 + 밀린 은행/배송/예약 업무 일괄 처리', reason: '에너지가 충분할 때 생활과 관련된 잡무를 한꺼번에 털어내면 마음이 가벼워져요.' }
        ]
      },
      '이동 중': {
        '매우 피곤함': [
          { title: '할 일 목록 확인 및 도착 후 처리할 용무 체크', reason: '이동 중 무리한 모바일 결제는 피하고, 도착해서 바로 처리할 체크리스트만 가볍게 확인해요.' }
        ],
        '보통': [
          { title: '경로상 정류장 근처 물품 픽업 또는 일정 정리', reason: '이동 동선에 겹치는 간단한 용무나 주간 일정 정리를 안전하게 처리해요. (운전 시 제외)' }
        ],
        '활기참': [
          { title: '환승 구간 편의점·은행 ATM 들르기 및 일정 조율', reason: '이동 경로 내 짧은 경유지로 미뤄뒀던 용무를 효율적으로 해결해 보세요.' }
        ]
      }
    }
  };

  const PREP_TEMPLATES = {
    '학교': [
      '강의실·도서관 이동 및 다음 수업 준비·정리',
      '자리 정리 및 다음 강의 자료 미리 챙기기'
    ],
    '집': [
      '작업 공간 정돈 및 다음 일정 준비',
      '물 한 잔 마시고 다음 일정 동선 정리'
    ],
    '이동 중': [
      '목적지 하차 준비 및 도착 후 동선 체크',
      '소지품 점검 및 다음 장소 이동 마무리'
    ]
  };

  const AUTO_BREAK_TEMPLATES = {
    '학교': '중간 휴식 · 스트레칭 및 물 마시기',
    '집': '중간 휴식 · 환기하고 눈 잠시 쉬기',
    '이동 중': '중간 휴식 · 화면 끄고 호흡 고르기'
  };

  /* ==================== STATE ==================== */
  let state = {
    activeView: 'home',
    input: {
      date: '',
      startTime: '10:30',
      duration: 120,
      location: '학교',
      condition: '보통',
      goals: ['공부', '과제'],
      memo: ''
    },
    variationSeed: 0,
    schedules: [], // all saved schedules
    activeScheduleId: null,
    historyWeekdayFilter: 'all',
    timer: {
      scheduleId: null,
      activityId: null,
      status: 'idle', // idle | running | paused | ended
      durationSeconds: 0,
      remainingSeconds: 0,
      endTimestamp: null
    },
    storageError: null
  };

  let timerIntervalHandle = null;
  let audioCtx = null;
  let modalContext = null; // { mode: 'edit'|'add', activityId: string|null, pendingAdjustedPlan: null }

  /* ==================== SAFE LOCAL STORAGE ==================== */
  function safeGetStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      state.storageError = '브라우저 저장소에 접근할 수 없습니다.';
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
      state.storageError = null;
      return true;
    } catch (err) {
      state.storageError = '저장 공간이 부족하거나 브라우저 설정으로 저장에 실패했습니다.';
      showToast(state.storageError, 'error');
      return false;
    }
  }

  function loadAllFromStorage() {
    // Schedules
    const rawSchedules = safeGetStorage(STORAGE_KEY_SCHEDULES);
    if (rawSchedules) {
      try {
        const parsed = JSON.parse(rawSchedules);
        if (Array.isArray(parsed)) {
          state.schedules = parsed.filter(isValidScheduleRecord);
        } else {
          throw new Error('Invalid schedule array');
        }
      } catch (e) {
        state.schedules = [];
        showToast('저장된 시간표 데이터를 읽는 중 문제가 있어 초기화했습니다.', 'warn');
      }
    }

    // Active ID
    const savedActiveId = safeGetStorage(STORAGE_KEY_ACTIVE_ID);
    if (savedActiveId && state.schedules.some(s => s.id === savedActiveId)) {
      state.activeScheduleId = savedActiveId;
    } else if (state.schedules.length > 0) {
      state.activeScheduleId = state.schedules[0].id;
    }

    // Draft input
    const rawDraft = safeGetStorage(STORAGE_KEY_DRAFT);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft);
        if (draft && typeof draft === 'object') {
          if (typeof draft.startTime === 'string' && /^\d{2}:\d{2}$/.test(draft.startTime)) {
            state.input.startTime = draft.startTime;
          }
          if (typeof draft.duration === 'number' && draft.duration >= 0 && draft.duration <= 240 && draft.duration % 15 === 0) {
            state.input.duration = draft.duration;
          }
          if (['학교', '집', '이동 중'].includes(draft.location)) {
            state.input.location = draft.location;
          }
          if (['매우 피곤함', '보통', '활기참'].includes(draft.condition)) {
            state.input.condition = draft.condition;
          }
          if (Array.isArray(draft.goals)) {
            const validGoals = draft.goals.filter(g => GOAL_LIST.includes(g));
            state.input.goals = validGoals;
          }
          if (typeof draft.memo === 'string') {
            state.input.memo = draft.memo;
          }
          if (typeof draft.date === 'string' && parseLocalDate(draft.date)) {
            state.input.date = draft.date;
          }
        }
      } catch (e) {
        // Ignore bad draft
      }
    }
    if (!state.input.date || !parseLocalDate(state.input.date)) {
      state.input.date = getTodayLocalDateStr();
    }

    // Timer
    const rawTimer = safeGetStorage(STORAGE_KEY_TIMER);
    if (rawTimer) {
      try {
        const t = JSON.parse(rawTimer);
        if (t && typeof t === 'object' && t.scheduleId && t.activityId) {
          const owner = state.schedules.find(s => s.id === t.scheduleId);
          const act = owner ? owner.activities.find(a => a.id === t.activityId) : null;
          if (owner && act) {
            state.timer = {
              scheduleId: t.scheduleId,
              activityId: t.activityId,
              status: ['running', 'paused', 'ended'].includes(t.status) ? t.status : 'idle',
              durationSeconds: Number(t.durationSeconds) || act.duration * 60,
              remainingSeconds: Number(t.remainingSeconds) || 0,
              endTimestamp: typeof t.endTimestamp === 'number' ? t.endTimestamp : null
            };
          }
        }
      } catch (e) {
        // Ignore bad timer JSON
      }
    }
  }

  function isValidScheduleRecord(rec) {
    return rec &&
      typeof rec.id === 'string' &&
      typeof rec.date === 'string' &&
      typeof rec.startTime === 'string' &&
      typeof rec.duration === 'number' &&
      Array.isArray(rec.activities);
  }

  function persistSchedules(statusLabel) {
    const ok = safeSetStorage(STORAGE_KEY_SCHEDULES, JSON.stringify(state.schedules));
    if (state.activeScheduleId) {
      safeSetStorage(STORAGE_KEY_ACTIVE_ID, state.activeScheduleId);
    }
    if (ok) {
      updateSaveStatusUI(statusLabel || '자동 저장 완료');
    }
    updateBadges();
  }

  function persistDraft() {
    safeSetStorage(STORAGE_KEY_DRAFT, JSON.stringify(state.input));
  }

  function persistTimer() {
    safeSetStorage(STORAGE_KEY_TIMER, JSON.stringify(state.timer));
  }

  /* ==================== LOCAL DATE & TIME HELPERS ==================== */
  function getTodayLocalDateStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getCurrentLocalTimeStr() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function parseLocalDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
      return null;
    }
    return dt;
  }

  function getWeekdayKo(dateStr) {
    const dt = parseLocalDate(dateStr);
    if (!dt) return '';
    return WEEKDAYS[dt.getDay()];
  }

  function formatKoreanDate(dateStr) {
    const dt = parseLocalDate(dateStr);
    if (!dt) return '유효하지 않은 날짜';
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    const w = WEEKDAYS[dt.getDay()];
    return `${y}년 ${m}월 ${d}일 (${w})`;
  }

  function formatKoreanTime(hhmm) {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const period = h < 12 ? '오전' : '오후';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    if (m === 0) return `${period} ${h12}시`;
    return `${period} ${h12}시 ${m}분`;
  }

  function formatDuration(minutes) {
    const m = Number(minutes) || 0;
    if (m === 0) return '0분';
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    if (hrs === 0) return `${mins}분`;
    if (mins === 0) return `${hrs}시간`;
    return `${hrs}시간 ${mins}분`;
  }

  function addMinutesToTime(startHHMM, offsetMinutes) {
    const [sh, sm] = startHHMM.split(':').map(Number);
    const total = sh * 60 + sm + offsetMinutes;
    const dayOffset = Math.floor(total / 1440);
    const mod = ((total % 1440) + 1440) % 1440;
    const eh = String(Math.floor(mod / 60)).padStart(2, '0');
    const em = String(mod % 60).padStart(2, '0');
    return {
      hhmm: `${eh}:${em}`,
      dayOffset
    };
  }

  function formatLocalTimestampNow() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  function formatSecondsMMSS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function generateUniqueId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  /* ==================== TIME ALLOCATION & SCHEDULE ENGINE ==================== */
  function parseMemoTasks(memoStr) {
    if (!memoStr || !memoStr.trim()) return [];
    const parts = memoStr
      .split(/[,/\n;]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const keywordRules = [
      { goal: '과제', words: ['과제', '레포트', '보고서', '발표', 'ppt', '피피티', '코딩', '제출', '초안', '팀플'] },
      { goal: '공부', words: ['공부', '복습', '예습', '단어', '암기', '시험', '기출', '문제', '강의', '교재', '장', '챕터', '영어', '수학', '토익'] },
      { goal: '운동', words: ['운동', '헬스', '러닝', '산책', '걷기', '스트레칭', '요가', '조깅'] },
      { goal: '식사', words: ['식사', '밥', '점심', '저녁', '아침', '학식', '간식', '카페', '커피'] },
      { goal: '휴식', words: ['휴식', '낮잠', '잠', '쉬기', '음악', '명상'] },
      { goal: '개인 용무', words: ['은행', '인쇄', '프린트', '출력', '대출', '반납', '구매', '쇼핑', '택배', '우체국', '병원', '예약', '행정'] }
    ];
    return parts.map(text => {
      const lower = text.toLowerCase();
      let matchedGoal = null;
      for (const rule of keywordRules) {
        if (rule.words.some(w => lower.includes(w))) {
          matchedGoal = rule.goal;
          break;
        }
      }
      return { text, matchedGoal };
    });
  }

  /**
   * Allocates totalMinutes (multiple of 15) across prioritized goals, plus realistic prep & break blocks.
   * Strictly guarantees:
   * 1. 15-min increments
   * 2. Sum === totalMinutes
   * 3. Higher priority goals receive >= (and for Rank 1 vs Rank 2 when >= 2 included, strictly >) lower priority goals
   * 4. Lower priority goals omitted cleanly with explanations if time is too short
   */
  function allocateTimeBudget(totalMinutes, orderedGoals, condition) {
    const totalUnits = Math.floor(totalMinutes / 15);
    const hasExplicitRest = orderedGoals.includes('휴식');

    let prepUnits = 0;
    let breakUnits = 0;

    if (totalUnits >= 6) {
      // 90분 이상: 이동 및 준비 15분 확보
      prepUnits = 1;
    }
    if (totalUnits >= 10 && !hasExplicitRest) {
      // 150분 이상이고 사용자가 휴식을 직접 넣지 않았다면 중간 휴식 확보
      breakUnits = condition === '매우 피곤함' && totalUnits >= 12 ? 2 : 1;
    }

    let goalUnits = totalUnits - prepUnits - breakUnits;
    if (goalUnits < 1) {
      prepUnits = 0;
      breakUnits = 0;
      goalUnits = totalUnits;
    }

    // Determine maximum number of goals that can fit while keeping Rank 1 strictly > Rank 2 (when k >= 2)
    // Minimum units needed for k goals with u_1 >= 2 and u_2..k >= 1: k === 1 ? 1 : (k + 1)
    let maxFit = 1;
    for (let k = orderedGoals.length; k >= 1; k--) {
      const minRequired = k === 1 ? 1 : k + 1;
      if (goalUnits >= minRequired) {
        maxFit = k;
        break;
      }
    }

    const includedGoals = orderedGoals.slice(0, maxFit);
    const omittedGoals = orderedGoals.slice(maxFit).map((g, idx) => {
      const rank = maxFit + idx + 1;
      return {
        goal: g,
        rank,
        reason: `${rank}순위 '${g}' 목표는 총 공강시간(${formatDuration(totalMinutes)}) 안에서 상위 순위 목표에 충분한 시간을 배분하기 위해 이번 일정에서는 제외되었어요.`
      };
    });

    // Allocate units across includedGoals
    const units = new Array(includedGoals.length).fill(1);
    if (includedGoals.length >= 2) {
      units[0] = 2; // Ensure Rank 1 > Rank 2 from the start
    }
    let assigned = units.reduce((a, b) => a + b, 0);
    let remaining = goalUnits - assigned;

    const weights = includedGoals.map((_, i) => PRIORITY_WEIGHTS[i] ?? 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const targets = weights.map(w => (goalUnits * w) / weightSum);

    while (remaining > 0) {
      let bestIdx = -1;
      let bestDeficit = -Infinity;

      for (let i = 0; i < includedGoals.length; i++) {
        // Monotonicity guard:
        // - For i > 0, units[i] + 1 must not exceed units[i - 1]
        // - Specifically for i === 1, units[1] + 1 must stay strictly less than units[0]
        if (i === 1 && units[1] + 1 >= units[0]) continue;
        if (i > 1 && units[i] + 1 > units[i - 1]) continue;

        const deficit = targets[i] - units[i];
        if (deficit > bestDeficit + 1e-9) {
          bestDeficit = deficit;
          bestIdx = i;
        }
      }

      if (bestIdx === -1) {
        // Fallback to Rank 1 so Rank 1 absorbs remaining while staying strictly top
        bestIdx = 0;
      }

      units[bestIdx] += 1;
      remaining -= 1;
    }

    const goalAllocations = includedGoals.map((goal, idx) => ({
      goal,
      rank: idx + 1,
      weight: weights[idx],
      minutes: units[idx] * 15
    }));

    return {
      goalAllocations,
      omittedGoals,
      prepMinutes: prepUnits * 15,
      breakMinutes: breakUnits * 15
    };
  }

  function pickTemplate(pool, seedOffset) {
    if (!pool || pool.length === 0) return null;
    return pool[Math.abs(seedOffset) % pool.length];
  }

  function buildScheduleFromInput(inputData, seed) {
    const { date, startTime, duration, location, condition, goals, memo } = inputData;
    const alloc = allocateTimeBudget(duration, goals, condition);
    const parsedMemo = parseMemoTasks(memo);
    const usedMemoIdx = new Set();

    // Split long goal allocations (>= 75m for Study/Assignment/Exercise) into realistic blocks when helpful
    const activityBlocks = [];

    alloc.goalAllocations.forEach((ga, gIdx) => {
      const catPool = (ACTIVITY_TEMPLATES[ga.goal] &&
        ACTIVITY_TEMPLATES[ga.goal][location] &&
        ACTIVITY_TEMPLATES[ga.goal][location][condition]) ||
        [{ title: `${ga.goal} 집중 활동`, reason: `${location}에서 ${condition} 컨디션에 맞춰 진행합니다.` }];

      // Find matching memo item for this goal
      let matchedMemo = null;
      for (let i = 0; i < parsedMemo.length; i++) {
        if (!usedMemoIdx.has(i) && parsedMemo[i].matchedGoal === ga.goal) {
          matchedMemo = parsedMemo[i];
          usedMemoIdx.add(i);
          break;
        }
      }
      // If Rank 1 and still unused unmatched memo item exists, assign it to Rank 1
      if (!matchedMemo && gIdx === 0) {
        for (let i = 0; i < parsedMemo.length; i++) {
          if (!usedMemoIdx.has(i) && parsedMemo[i].matchedGoal === null) {
            matchedMemo = parsedMemo[i];
            usedMemoIdx.add(i);
            break;
          }
        }
      }

      const shouldSplit = ga.minutes >= 75 && ['공부', '과제', '운동'].includes(ga.goal) && catPool.length >= 2;
      if (shouldSplit) {
        const firstUnits = Math.ceil((ga.minutes / 15) / 2);
        const firstMin = firstUnits * 15;
        const secondMin = ga.minutes - firstMin;

        const tpl1 = pickTemplate(catPool, seed + gIdx);
        const tpl2 = pickTemplate(catPool, seed + gIdx + 1);

        const title1 = matchedMemo ? `${matchedMemo.text} (${tpl1.title})` : tpl1.title;
        const reason1 = matchedMemo
          ? `메모하신 '${matchedMemo.text}' 내용을 반영했어요. ${tpl1.reason}`
          : tpl1.reason;

        activityBlocks.push({
          id: generateUniqueId('act'),
          goalTag: ga.goal,
          type: ga.goal,
          duration: firstMin,
          title: title1,
          reason: reason1,
          completed: false,
          priorityRank: ga.rank
        });

        activityBlocks.push({
          id: generateUniqueId('act'),
          goalTag: ga.goal,
          type: ga.goal,
          duration: secondMin,
          title: tpl2.title,
          reason: `${ga.rank}순위 목표 시간을 두 단계로 나누어 집중력이 떨어지지 않도록 구성했어요. ${tpl2.reason}`,
          completed: false,
          priorityRank: ga.rank
        });
      } else {
        const tpl = pickTemplate(catPool, seed + gIdx);
        const title = matchedMemo ? `${matchedMemo.text} · ${tpl.title}` : tpl.title;
        const reason = matchedMemo
          ? `입력하신 메모('${matchedMemo.text}')를 ${ga.rank}순위 '${ga.goal}' 일정에 직접 반영했어요. ${tpl.reason}`
          : tpl.reason;

        activityBlocks.push({
          id: generateUniqueId('act'),
          goalTag: ga.goal,
          type: ga.goal,
          duration: ga.minutes,
          title,
          reason,
          completed: false,
          priorityRank: ga.rank
        });
      }
    });

    // Interleave explicit '휴식' or auto breakUnits realistically between heavy tasks
    let arranged = [];
    const restIndex = activityBlocks.findIndex(b => b.type === '휴식');
    if (restIndex !== -1 && activityBlocks.length >= 3 && restIndex === activityBlocks.length - 1) {
      const restBlock = activityBlocks.splice(restIndex, 1)[0];
      const mid = Math.ceil(activityBlocks.length / 2);
      arranged = [
        ...activityBlocks.slice(0, mid),
        restBlock,
        ...activityBlocks.slice(mid)
      ];
    } else {
      arranged = [...activityBlocks];
    }

    // Insert auto intermediate break if reserved
    if (alloc.breakMinutes > 0) {
      const midIdx = Math.max(1, Math.floor(arranged.length / 2));
      arranged.splice(midIdx, 0, {
        id: generateUniqueId('act'),
        goalTag: '중간 휴식',
        type: '휴식',
        duration: alloc.breakMinutes,
        title: AUTO_BREAK_TEMPLATES[location] || '잠깐 숨 고르기 & 중간 휴식',
        reason: `${formatDuration(duration)}의 긴 공강 동안 집중력이 흐트러지지 않도록 중간 회복 시간을 확보했어요.`,
        completed: false,
        isAutoBuffer: true
      });
    }

    // Add realistic transition / prep block if reserved
    if (alloc.prepMinutes > 0) {
      const prepTitle = pickTemplate(PREP_TEMPLATES[location], seed) || '장소 이동 및 다음 일정 준비';
      const prepBlock = {
        id: generateUniqueId('act'),
        goalTag: '이동 및 준비',
        type: '이동 및 준비',
        duration: alloc.prepMinutes,
        title: prepTitle,
        reason: `공강 마무리를 서두르지 않고 다음 수업이나 일정을 여유 있게 준비할 수 있도록 ${alloc.prepMinutes}분을 배정했어요.`,
        completed: false,
        isAutoBuffer: true
      };
      if (location === '이동 중' && seed % 2 === 1) {
        arranged.unshift(prepBlock);
      } else {
        arranged.push(prepBlock);
      }
    }

    // Recompute exact timestamps
    const timedActivities = computeTimelineTimes(startTime, arranged);

    const greeting = buildAssistantGreeting(inputData, alloc, seed);
    const reasonSummary = buildReasonSummary(inputData, alloc);

    const record = {
      id: generateUniqueId('sched'),
      date,
      dayOfWeek: getWeekdayKo(date),
      startTime,
      duration,
      location,
      condition,
      goals: [...goals],
      priorities: alloc.goalAllocations,
      omittedGoals: alloc.omittedGoals,
      memo: memo.trim(),
      greeting,
      reasonSummary,
      activities: timedActivities,
      lastModified: formatLocalTimestampNow(),
      lastModifiedMs: Date.now()
    };
    record.progress = computeProgress(record.activities);
    return record;
  }

  function computeTimelineTimes(startHHMM, activities) {
    let cursor = 0;
    return activities.map(act => {
      const startInfo = addMinutesToTime(startHHMM, cursor);
      cursor += act.duration;
      const endInfo = addMinutesToTime(startHHMM, cursor);
      return {
        ...act,
        startTime: startInfo.hhmm,
        startDayOffset: startInfo.dayOffset,
        endTime: endInfo.hhmm,
        endDayOffset: endInfo.dayOffset
      };
    });
  }

  function computeProgress(activities) {
    const totalCount = activities.length;
    const completedCount = activities.filter(a => a.completed).length;
    const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    return { completedCount, totalCount, percent };
  }

  function hasBatchim(word) {
    if (!word) return false;
    const ch = word.charCodeAt(word.length - 1);
    if (ch < 0xAC00 || ch > 0xD7A3) return false;
    return (ch - 0xAC00) % 28 !== 0;
  }

  function pickJosa(word, withBatchim, withoutBatchim) {
    return hasBatchim(word) ? withBatchim : withoutBatchim;
  }

  function buildAssistantGreeting(inputData, alloc, seed) {
    const durText = formatDuration(inputData.duration);
    const topGoal = alloc.goalAllocations[0].goal;
    const secondGoal = alloc.goalAllocations[1] ? alloc.goalAllocations[1].goal : null;
    const condTone = {
      '매우 피곤함': '조금 피곤한 날이니 무리하지 않고 회복과 핵심만 챙기는 쪽으로',
      '보통': '컨디션이 안정적이니 집중과 휴식의 균형을 딱 맞춰서',
      '활기참': '에너지가 넘치는 날이니 평소보다 한 단계 더 알차게'
    }[inputData.condition];

    const locTone = {
      '학교': '학교에서 바로 움직일 수 있게',
      '집': '집의 편안한 집중 환경을 살려',
      '이동 중': '대중교통 이동 중에도 안전하게 소화할 수 있도록'
    }[inputData.location];

    const topWa = pickJosa(topGoal, '과', '와');
    const topEul = pickJosa(topGoal, '을', '를');
    const variants = [
      `오! 오늘 공강이 ${durText}이나 있네요! 😎 ${inputData.location}에 계시고 컨디션은 '${inputData.condition}' 상태시니, 1순위 '${topGoal}'${secondGoal ? `${topWa} 2순위 '${secondGoal}'` : ''} 중심으로 탄탄하게 짜봤어요. ${inputData.duration >= 90 ? '마무리 정리 시간까지 넉넉히 챙겼으니 편하게 따라와 보세요! ✨' : '짧고 굵게 알찬 시간 보내봐요! 💪'}`,
      `반가워요! ${formatKoreanTime(inputData.startTime)}부터 시작되는 ${durText}의 공강시간, ${locTone} 딱 맞게 설계했어요. 🗓️ ${condTone} 1순위 '${topGoal}'에 가장 큰 비중을 두었답니다. 하나씩 완료 체크하면서 보람찬 공강 만들어봐요! ☕`,
      `오늘 ${durText} 공강 비서 출동! ✨ ${inputData.location}에서 보내는 귀중한 시간, '${topGoal}'${topEul} 최우선으로 두고${secondGoal ? ` '${secondGoal}'까지` : ''} 알뜰하게 채웠어요. 컨디션이 '${inputData.condition}'인 점을 꼼꼼히 반영했으니 지금 바로 타이머와 함께 시작해 볼까요? 🚀`
    ];

    return variants[Math.abs(seed) % variants.length];
  }

  function buildReasonSummary(inputData, alloc) {
    const top = alloc.goalAllocations[0];
    const parts = [
      `${formatDuration(inputData.duration)}의 공강시간을 '${inputData.location}' 환경과 '${inputData.condition}' 컨디션에 맞춰 15분 단위로 구성했습니다.`,
      `가장 높은 1순위 '${top.goal}'에 ${formatDuration(top.minutes)}을 우선 배정했고`
    ];
    if (alloc.goalAllocations.length > 1) {
      const restNames = alloc.goalAllocations.slice(1).map(g => `${g.rank}순위 '${g.goal}'(${formatDuration(g.minutes)})`).join(', ');
      parts.push(`이어서 ${restNames} 순으로 가중치를 반영했습니다.`);
    } else {
      parts.push(`선택한 목표에 온전히 집중할 수 있도록 배치했습니다.`);
    }
    if (alloc.prepMinutes > 0 || alloc.breakMinutes > 0) {
      const extras = [];
      if (alloc.breakMinutes > 0) extras.push(`중간 휴식 ${alloc.breakMinutes}분`);
      if (alloc.prepMinutes > 0) extras.push(`이동 및 준비 ${alloc.prepMinutes}분`);
      parts.push(`여기에 ${extras.join('과 ')}을 현실적으로 포함했습니다.`);
    }
    if (inputData.memo && inputData.memo.trim()) {
      parts.push(`작성하신 메모('${inputData.memo.trim()}')도 활동에 반영했습니다.`);
    }
    return parts.join(' ');
  }

  /* ==================== UI REFERENCES & VIEW SWITCHING ==================== */
  function getActiveSchedule() {
    if (!state.activeScheduleId) return null;
    return state.schedules.find(s => s.id === state.activeScheduleId) || null;
  }

  function switchView(viewName) {
    state.activeView = viewName;
    safeSetStorage(STORAGE_KEY_VIEW, viewName);
    document.querySelectorAll('.view-panel').forEach(el => {
      el.classList.toggle('is-active', el.id === `view-${viewName}`);
    });
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.view === viewName);
    });

    // Reset scroll to very top on every view transition so content starts naturally below header
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;

    if (viewName === 'input') {
      renderInputView();
    } else if (viewName === 'result') {
      renderResultView();
    } else if (viewName === 'history') {
      renderHistoryView();
    } else {
      renderHomeView();
    }
  }

  function updateBadges() {
    const badge = document.getElementById('historyCountBadge');
    if (badge) badge.textContent = String(state.schedules.length);
  }

  function updateSaveStatusUI(text) {
    const el = document.getElementById('saveStatusText');
    if (el) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      el.textContent = `${text} · ${hh}:${mm}`;
    }
  }

  function showToast(message, variant) {
    const container = document.getElementById('toastContainer');
    container.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'toast' + (variant === 'warn' ? ' is-warn' : variant === 'error' ? ' is-error' : '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.22s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 240);
    }, 2200);
  }

  /* ==================== RENDER: HOME VIEW ==================== */
  function renderHomeView() {
    const resumeBtn = document.getElementById('homeResumeBtn');
    const active = getActiveSchedule();
    resumeBtn.style.display = active ? 'inline-flex' : 'none';
  }

  /* ==================== RENDER: INPUT VIEW ==================== */
  function renderInputView() {
    const dateInput = document.getElementById('gapDateInput');
    const timeInput = document.getElementById('gapStartTimeInput');
    const memoInput = document.getElementById('memoInput');

    dateInput.value = state.input.date;
    timeInput.value = state.input.startTime;
    memoInput.value = state.input.memo;

    updateDatePreviewUI();
    updateStartTimePreviewUI();
    syncDurationUI(state.input.duration);
    renderChoiceSelections();
    renderGoalsAndPriorityUI();
    updateSubmitSummaryUI();
    renderSameWeekdayHintOnInput();
  }

  function updateDatePreviewUI() {
    const preview = document.getElementById('selectedDatePreview');
    const hint = document.getElementById('dateWeekdayHint');
    const dt = parseLocalDate(state.input.date);
    if (dt) {
      preview.textContent = formatKoreanDate(state.input.date);
      hint.textContent = `${getWeekdayKo(state.input.date)}요일`;
    } else {
      preview.textContent = '날짜를 선택해 주세요';
      hint.textContent = '올바른 날짜 필요';
    }
  }

  function updateStartTimePreviewUI() {
    const hint = document.getElementById('formattedStartTimeHint');
    const formatted = formatKoreanTime(state.input.startTime);
    hint.textContent = formatted || '시간 선택 필요';

    document.querySelectorAll('.start-preset-btn').forEach(btn => {
      btn.classList.toggle('is-selected', btn.dataset.time === state.input.startTime);
    });
    updateDurationSpanPreview();
  }

  function updateDurationSpanPreview() {
    const spanEl = document.getElementById('durationTimeSpanPreview');
    if (!/^\d{2}:\d{2}$/.test(state.input.startTime)) {
      spanEl.textContent = `${state.input.duration}분`;
      return;
    }
    if (state.input.duration === 0) {
      spanEl.textContent = '0분 (공강 없음)';
      return;
    }
    const end = addMinutesToTime(state.input.startTime, state.input.duration);
    const endPrefix = end.dayOffset > 0 ? `+${end.dayOffset}일 ` : '';
    spanEl.textContent = `${state.input.startTime} ~ ${endPrefix}${end.hhmm} (${state.input.duration}분)`;
  }

  /**
   * Single source of truth for duration slider, thumb position, fill bar, tick labels, quick buttons, and 0-min notice.
   * Position ratio = (selectedMinutes / 240) * 100
   */
  function syncDurationUI(minutes) {
    const clamped = Math.max(0, Math.min(240, Math.round(minutes / 15) * 15));
    state.input.duration = clamped;

    const ratioPct = (clamped / 240) * 100;
    const slider = document.getElementById('durationSlider');
    const fill = document.getElementById('sliderFill');
    const thumb = document.getElementById('sliderThumb');
    const display = document.getElementById('durationDisplayText');
    const zeroNotice = document.getElementById('zeroDurationNotice');

    slider.value = String(clamped);
    fill.style.width = `${ratioPct}%`;
    thumb.style.left = `${ratioPct}%`;
    display.textContent = formatDuration(clamped);

    document.querySelectorAll('.dur-btn').forEach(btn => {
      btn.classList.toggle('is-selected', Number(btn.dataset.minutes) === clamped);
    });

    document.querySelectorAll('.slider-tick-label').forEach(lbl => {
      lbl.classList.toggle('is-active', Number(lbl.dataset.minutes) === clamped);
    });

    zeroNotice.style.display = clamped === 0 ? 'flex' : 'none';
    updateDurationSpanPreview();
    updateSubmitSummaryUI();
  }

  function renderChoiceSelections() {
    document.querySelectorAll('#locationOptions .choice-card').forEach(card => {
      card.classList.toggle('is-selected', card.dataset.location === state.input.location);
    });
    document.querySelectorAll('#conditionOptions .choice-card').forEach(card => {
      card.classList.toggle('is-selected', card.dataset.condition === state.input.condition);
    });
    const transitBox = document.getElementById('transitSafetyNotice');
    transitBox.style.display = state.input.location === '이동 중' ? 'flex' : 'none';
  }

  function renderGoalsAndPriorityUI() {
    const grid = document.getElementById('goalsGrid');
    const listEl = document.getElementById('priorityList');
    const countEl = document.getElementById('selectedGoalCountText');

    countEl.textContent = `${state.input.goals.length}개 선택됨`;

    if (grid.children.length === 0) {
      grid.innerHTML = GOAL_LIST.map(goal => {
        const cat = CATEGORIES[goal];
        return `
          <button type="button" class="goal-toggle" data-goal="${goal}" aria-pressed="false">
            <span class="goal-toggle-left">
              <span class="goal-icon-box" style="background:${cat.bg}; border:1px solid ${cat.border};">${cat.emoji}</span>
              <span>
                <div style="font-size:14px; font-weight:700; color:var(--navy-900);">${goal}</div>
                <div style="font-size:11.5px; color:var(--text-muted);">${cat.desc}</div>
              </span>
            </span>
            <span class="goal-rank-pill"></span>
          </button>
        `;
      }).join('');
    }

    grid.querySelectorAll('.goal-toggle').forEach(btn => {
      const goal = btn.dataset.goal;
      const rankIdx = state.input.goals.indexOf(goal);
      const selected = rankIdx !== -1;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', String(selected));
      const pill = btn.querySelector('.goal-rank-pill');
      if (pill) pill.textContent = selected ? `${rankIdx + 1}순위` : '';
    });

    if (state.input.goals.length === 0) {
      listEl.innerHTML = `<div style="font-size:13px; color:var(--danger-main); font-weight:600; padding:6px 2px;">목표를 최소 1개 이상 선택해 주세요.</div>`;
    } else {
      listEl.innerHTML = state.input.goals.map((goal, idx) => {
        const cat = CATEGORIES[goal];
        const weight = PRIORITY_WEIGHTS[idx] ?? 1;
        const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
        return `
          <div class="priority-row" data-goal="${goal}">
            <div class="priority-left">
              <span class="rank-badge ${rankClass}">${idx + 1}순위</span>
              <span>${cat.emoji}</span>
              <strong style="font-size:14px; color:var(--navy-900);">${goal}</strong>
              <span class="priority-weight-hint">(가중치 ${weight})</span>
            </div>
            <div class="priority-actions">
              <button type="button" class="btn btn-secondary btn-xs move-priority-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="${goal} 위로 이동">↑ 위로</button>
              <button type="button" class="btn btn-secondary btn-xs move-priority-down" data-idx="${idx}" ${idx === state.input.goals.length - 1 ? 'disabled' : ''} aria-label="${goal} 아래로 이동">↓ 아래로</button>
            </div>
          </div>
        `;
      }).join('');
    }
    updateSubmitSummaryUI();
  }

  function updateSubmitSummaryUI() {
    const el = document.getElementById('submitReadySummary');
    const dur = formatDuration(state.input.duration);
    const topGoal = state.input.goals.length > 0 ? `1순위 ${state.input.goals[0]} (총 ${state.input.goals.length}개)` : '목표 미선택';
    el.textContent = `선택 조건: ${dur} · ${state.input.location} · ${state.input.condition} · ${topGoal}`;
  }

  function renderSameWeekdayHintOnInput() {
    const box = document.getElementById('sameWeekdayHintBox');
    const text = document.getElementById('sameWeekdayHintText');
    const weekday = getWeekdayKo(state.input.date);
    if (!weekday) {
      box.style.display = 'none';
      return;
    }
    const match = state.schedules.find(s => s.dayOfWeek === weekday && s.date !== state.input.date) ||
      state.schedules.find(s => s.dayOfWeek === weekday);
    if (match) {
      box.style.display = 'flex';
      const prefix = match.date === state.input.date ? '오늘 앞서' : `지난 ${formatKoreanDate(match.date)}에`;
      text.textContent = `${prefix} 만든 ${weekday}요일 시간표(${formatDuration(match.duration)}, ${match.goals.join('·')})가 있어요!`;
    } else {
      box.style.display = 'none';
    }
  }

  function validateInputs() {
    const errorBox = document.getElementById('inputErrorBox');
    const errorText = document.getElementById('inputErrorText');
    const showErr = (msg, focusId) => {
      errorText.textContent = msg;
      errorBox.style.display = 'flex';
      if (focusId) {
        const target = document.getElementById(focusId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    };

    if (!state.input.date || !parseLocalDate(state.input.date)) {
      return showErr('올바른 공강 날짜를 선택해 주세요.', 'gapDateInput');
    }
    if (!/^\d{2}:\d{2}$/.test(state.input.startTime)) {
      return showErr('공강 시작 시간을 정확히 선택해 주세요.', 'gapStartTimeInput');
    }
    if (state.input.duration === 0) {
      return showErr('공강시간이 없습니다. 15분 이상 선택해 주세요.', 'durationSliderArea');
    }
    if (state.input.goals.length === 0) {
      return showErr('오늘의 목표를 최소 1개 이상 선택해 주세요.', 'goalsGrid');
    }

    errorBox.style.display = 'none';
    return true;
  }

  /* ==================== RENDER: RESULT VIEW ==================== */
  function renderResultView() {
    const sched = getActiveSchedule();
    const emptyEl = document.getElementById('resultEmptyState');
    const contentEl = document.getElementById('resultContent');

    if (!sched) {
      emptyEl.style.display = 'block';
      contentEl.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';
    contentEl.style.display = 'block';

    // Greeting
    document.getElementById('greetingText').textContent = sched.greeting;

    // Summary Chips
    const endInfo = addMinutesToTime(sched.startTime, sched.duration);
    const endStr = endInfo.dayOffset > 0 ? `+${endInfo.dayOffset}일 ${endInfo.hhmm}` : endInfo.hhmm;
    const chips = [
      `📅 ${formatKoreanDate(sched.date)}`,
      `⏰ ${formatKoreanTime(sched.startTime)} ~ ${endStr} (${formatDuration(sched.duration)})`,
      `📍 ${sched.location}`,
      `🔋 ${sched.condition}`,
      `🎯 ${sched.goals.map((g, i) => `${i + 1}순위 ${g}`).join(' > ')}`
    ];
    if (sched.memo) {
      chips.push(`📝 ${sched.memo}`);
    }
    document.getElementById('summaryChips').innerHTML = chips
      .map(c => `<span class="meta-chip">${escapeHtml(c)}</span>`)
      .join('');

    // Omitted goals notice
    const omittedBox = document.getElementById('omittedGoalsNotice');
    const omittedText = document.getElementById('omittedGoalsText');
    if (sched.omittedGoals && sched.omittedGoals.length > 0) {
      omittedBox.style.display = 'flex';
      omittedText.textContent = sched.omittedGoals.map(o => o.reason).join(' ');
    } else {
      omittedBox.style.display = 'none';
    }

    // Progress
    sched.progress = computeProgress(sched.activities);
    document.getElementById('progressStatsText').textContent =
      `전체 진행률 · ${sched.progress.completedCount} / ${sched.progress.totalCount} 완료`;
    document.getElementById('progressPercentText').textContent = `${sched.progress.percent}%`;
    document.getElementById('progressFillBar').style.width = `${sched.progress.percent}%`;

    // Reason & Chart
    document.getElementById('reasonSummaryText').textContent = sched.reasonSummary;
    renderAllocationCharts(sched);

    // Timeline Cards
    renderTimelineCards(sched);

    // Timer Bar
    syncTimerUIFromState();
  }

  function computeCategoryTotals(sched) {
    const totals = {};
    let assignedMinutes = 0;
    sched.activities.forEach(act => {
      assignedMinutes += act.duration;
      totals[act.type] = (totals[act.type] || 0) + act.duration;
    });
    const freeMinutes = Math.max(0, sched.duration - assignedMinutes);
    return { totals, assignedMinutes, freeMinutes };
  }

  function renderAllocationCharts(sched) {
    const { totals, freeMinutes } = computeCategoryTotals(sched);
    const total = sched.duration || 1;

    const segments = [];
    Object.keys(CATEGORIES).forEach(catName => {
      const mins = totals[catName] || 0;
      if (mins > 0) {
        segments.push({
          name: catName,
          minutes: mins,
          pct: Math.round((mins / total) * 1000) / 10,
          color: CATEGORIES[catName].color
        });
      }
    });
    if (freeMinutes > 0) {
      segments.push({
        name: '남은 여유 시간',
        minutes: freeMinutes,
        pct: Math.round((freeMinutes / total) * 1000) / 10,
        color: '#94A3B8'
      });
    }

    // 1. SVG Donut Chart
    const svg = document.getElementById('allocDonutSvg');
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    let circlesHtml = `<circle cx="90" cy="90" r="${radius}" fill="none" stroke="#E2E8F0" stroke-width="24"></circle>`;
    segments.forEach(seg => {
      const len = (seg.minutes / total) * circumference;
      circlesHtml += `<circle cx="90" cy="90" r="${radius}" fill="none" stroke="${seg.color}" stroke-width="24" stroke-dasharray="${len.toFixed(2)} ${circumference.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 90 90)"></circle>`;
      offset += len;
    });
    svg.innerHTML = circlesHtml;
    document.getElementById('donutCenterTotal').textContent = formatDuration(sched.duration);

    // 2. Stacked Horizontal Bar
    const stackedEl = document.getElementById('allocStackedBar');
    stackedEl.innerHTML = segments.map(seg => {
      const widthPct = (seg.minutes / total) * 100;
      return `<div class="stacked-seg" style="width: ${widthPct}%; background: ${seg.color};" title="${escapeHtml(seg.name)} ${formatDuration(seg.minutes)} (${seg.pct}%)"></div>`;
    }).join('');

    // 3. Legend Items
    const legendEl = document.getElementById('allocLegend');
    legendEl.innerHTML = segments.map(seg => `
      <div class="alloc-item">
        <div class="alloc-left">
          <span class="color-dot" style="background: ${seg.color};"></span>
          <span class="alloc-name">${escapeHtml(seg.name)}</span>
        </div>
        <span class="alloc-val">${formatDuration(seg.minutes)} (${seg.pct}%)</span>
      </div>
    `).join('');
  }

  function renderTimelineCards(sched) {
    const listEl = document.getElementById('timelineList');
    const { assignedMinutes, freeMinutes } = computeCategoryTotals(sched);
    const descEl = document.getElementById('scheduleMetaDesc');
    descEl.textContent = `총 공강 ${formatDuration(sched.duration)} 중 ${formatDuration(assignedMinutes)} 배정${freeMinutes > 0 ? ` · 남은 여유 시간 ${formatDuration(freeMinutes)}` : ' (100% 맞춤 구성)'}`;

    if (sched.activities.length === 0) {
      listEl.innerHTML = `
        <div class="free-buffer-card">
          <div class="free-buffer-info">
            <strong>현재 배정된 활동이 없습니다.</strong> 전체 ${formatDuration(sched.duration)}의 여유 시간이 남아 있어요.
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="addFirstActivityBtn">+ 활동 추가하기</button>
        </div>
      `;
      const firstBtn = document.getElementById('addFirstActivityBtn');
      if (firstBtn) firstBtn.addEventListener('click', () => openActivityModal('add'));
      return;
    }

    let html = sched.activities.map((act, idx) => {
      const cat = CATEGORIES[act.type] || CATEGORIES['개인 용무'];
      const isTimerTarget = state.timer.scheduleId === sched.id && state.timer.activityId === act.id;
      const timerStatus = isTimerTarget ? state.timer.status : 'idle';
      const isRunning = timerStatus === 'running';
      const isPaused = timerStatus === 'paused';

      let statusBadge = `<span class="act-state-tag state-upcoming">예정</span>`;
      if (act.completed) {
        statusBadge = `<span class="act-state-tag state-done">완료됨</span>`;
      } else if (isRunning) {
        statusBadge = `<span class="act-state-tag state-running">진행 중</span>`;
      } else if (isPaused) {
        statusBadge = `<span class="act-state-tag state-paused">일시정지</span>`;
      }

      const dayText = act.endDayOffset > 0
        ? `<span class="act-day-tag">${act.startDayOffset > 0 ? `+${act.startDayOffset}일~+${act.endDayOffset}일` : `+${act.endDayOffset}일 종료`}</span>`
        : '';

      let timerControlsHtml = '';
      if (isRunning) {
        const rem = computeLiveRemainingSeconds();
        timerControlsHtml = `
          <span class="timer-readout" data-timer-clock="${act.id}">${formatSecondsMMSS(rem)}</span>
          <button type="button" class="btn btn-mint btn-xs act-timer-pause" data-id="${act.id}">일시정지</button>
          <button type="button" class="btn btn-secondary btn-xs act-timer-reset" data-id="${act.id}">초기화</button>
        `;
      } else if (isPaused) {
        timerControlsHtml = `
          <span class="timer-readout" data-timer-clock="${act.id}">${formatSecondsMMSS(state.timer.remainingSeconds)}</span>
          <button type="button" class="btn btn-accent btn-xs act-timer-resume" data-id="${act.id}">재개</button>
          <button type="button" class="btn btn-secondary btn-xs act-timer-reset" data-id="${act.id}">초기화</button>
        `;
      } else {
        timerControlsHtml = `
          <button type="button" class="btn btn-soft btn-xs act-timer-start" data-id="${act.id}">⏱️ 타이머 시작 (${act.duration}분)</button>
        `;
      }

      return `
        <article class="activity-card cat-${cat.key} ${act.completed ? 'is-completed' : ''} ${isRunning ? 'is-running' : ''} ${isPaused ? 'is-paused' : ''}" data-act-id="${act.id}">
          <div class="act-time-col">
            <div>
              <div class="act-time-range">${act.startTime} ~ ${act.endTime}</div>
              ${dayText}
            </div>
            <div class="act-dur-pill">${formatDuration(act.duration)}</div>
            ${statusBadge}
          </div>

          <div class="act-body-col">
            <div class="act-top-row">
              <div class="act-title-wrap">
                <div class="act-badges">
                  <span class="cat-pill badge-${cat.key}">${cat.emoji} ${escapeHtml(act.type)}</span>
                  ${act.priorityRank ? `<span class="cat-pill" style="background:#F8FAFC; color:#334155; border-color:#E2E8F0;">${act.priorityRank}순위 목표</span>` : ''}
                </div>
                <h4 class="act-title">${escapeHtml(act.title)}</h4>
              </div>

              <button type="button" class="check-btn ${act.completed ? 'is-checked' : ''} act-toggle-done" data-id="${act.id}" aria-pressed="${act.completed}">
                <span>${act.completed ? '✓ 완료' : '○ 완료 체크'}</span>
              </button>
            </div>

            <p class="act-reason">${escapeHtml(act.reason || '')}</p>

            <div class="act-controls-row">
              <div class="timer-inline-group">
                ${timerControlsHtml}
              </div>
              <div class="edit-inline-group">
                <button type="button" class="btn btn-secondary btn-xs act-move-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="위로 순서 이동">↑</button>
                <button type="button" class="btn btn-secondary btn-xs act-move-down" data-idx="${idx}" ${idx === sched.activities.length - 1 ? 'disabled' : ''} aria-label="아래로 순서 이동">↓</button>
                <button type="button" class="btn btn-secondary btn-xs act-edit-btn" data-id="${act.id}">수정</button>
                <button type="button" class="btn btn-danger-soft btn-xs act-delete-btn" data-id="${act.id}">삭제</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    if (freeMinutes > 0) {
      const freeStart = addMinutesToTime(sched.startTime, assignedMinutes);
      const freeEnd = addMinutesToTime(sched.startTime, sched.duration);
      html += `
        <div class="free-buffer-card">
          <div class="free-buffer-info">
            <strong>남은 여유 시간 ${formatDuration(freeMinutes)}</strong> (${freeStart.hhmm} ~ ${freeEnd.hhmm})<br>
            새 활동을 추가하거나 기존 활동의 소요시간을 늘려 채울 수 있어요.
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn btn-soft btn-xs" id="fillFreeAddBtn">+ 활동 추가</button>
            <button type="button" class="btn btn-mint btn-xs" id="distributeFreeBtn">기존 활동에 자동 배분</button>
          </div>
        </div>
      `;
    }

    listEl.innerHTML = html;

    const fillAddBtn = document.getElementById('fillFreeAddBtn');
    if (fillAddBtn) fillAddBtn.addEventListener('click', () => openActivityModal('add'));
    const distBtn = document.getElementById('distributeFreeBtn');
    if (distBtn) distBtn.addEventListener('click', distributeFreeMinutesToSchedule);
  }

  /* ==================== SCHEDULE EDITING & TIME RECALCULATION ==================== */
  function finalizeScheduleMutation(sched, statusLabel) {
    sched.activities = computeTimelineTimes(sched.startTime, sched.activities);
    sched.progress = computeProgress(sched.activities);
    sched.lastModified = formatLocalTimestampNow();
    sched.lastModifiedMs = Date.now();
    persistSchedules(statusLabel);
    renderResultView();
  }

  function distributeFreeMinutesToSchedule() {
    const sched = getActiveSchedule();
    if (!sched || sched.activities.length === 0) return;
    const { freeMinutes } = computeCategoryTotals(sched);
    if (freeMinutes <= 0) return;
    // Add freeMinutes to highest-priority (or first non-prep) activity
    let targetIdx = sched.activities.findIndex(a => a.type !== '이동 및 준비');
    if (targetIdx === -1) targetIdx = 0;
    sched.activities[targetIdx].duration += freeMinutes;
    finalizeScheduleMutation(sched, '여유 시간 자동 배분 저장');
    showToast(`여유 시간 ${formatDuration(freeMinutes)}을 '${sched.activities[targetIdx].title}'에 배분했어요.`);
  }

  function moveActivityOrder(idx, direction) {
    const sched = getActiveSchedule();
    if (!sched) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= sched.activities.length) return;
    const arr = sched.activities;
    const temp = arr[idx];
    arr[idx] = arr[targetIdx];
    arr[targetIdx] = temp;
    finalizeScheduleMutation(sched, '순서 변경 저장');
    showToast('활동 순서와 시간을 다시 계산했어요.');
  }

  function toggleActivityDone(actId) {
    const sched = getActiveSchedule();
    if (!sched) return;
    const act = sched.activities.find(a => a.id === actId);
    if (!act) return;
    act.completed = !act.completed;
    finalizeScheduleMutation(sched, '완료 상태 저장');
  }

  /**
   * Computes how to trim other activities if `shortage > 0` without exceeding `sched.duration`.
   * Returns { possible: boolean, adjustedActivities: Array, summaryLines: Array, maxAvailableFromOthers: number }
   */
  function computeAutoTrimPlan(sched, excludeId, shortageMinutes) {
    const cloned = sched.activities.map(a => ({ ...a }));
    let needed = shortageMinutes;
    const summaryLines = [];

    // Priority order for trimming:
    // 1) '이동 및 준비' / auto buffers (can trim down to 0 and remove)
    // 2) later non-primary activities (trim down to min 15m)
    // 3) earlier activities except excludeId (trim down to min 15m)
    const candidates = cloned
      .map((a, idx) => ({ a, idx }))
      .filter(item => item.a.id !== excludeId)
      .sort((x, y) => {
        const xAuto = x.a.type === '이동 및 준비' || x.a.isAutoBuffer ? 0 : 1;
        const yAuto = y.a.type === '이동 및 준비' || y.a.isAutoBuffer ? 0 : 1;
        if (xAuto !== yAuto) return xAuto - yAuto;
        return y.idx - x.idx; // prefer later activities first
      });

    for (const item of candidates) {
      if (needed <= 0) break;
      const minKeep = (item.a.type === '이동 및 준비' || item.a.isAutoBuffer) ? 0 : 15;
      const reducible = Math.max(0, item.a.duration - minKeep);
      if (reducible <= 0) continue;
      const take = Math.min(needed, reducible);
      item.a.duration -= take;
      needed -= take;
      summaryLines.push(
        item.a.duration === 0
          ? `'${item.a.title}' 삭제 (-${formatDuration(take)})`
          : `'${item.a.title}' ${formatDuration(item.a.duration + take)} → ${formatDuration(item.a.duration)} (-${formatDuration(take)})`
      );
    }

    const filtered = cloned.filter(a => a.duration > 0);
    return {
      possible: needed === 0,
      adjustedActivities: filtered,
      summaryLines
    };
  }

  function openActivityModal(mode, activityId) {
    const sched = getActiveSchedule();
    if (!sched) return;

    modalContext = { mode, activityId: activityId || null, pendingAdjustedPlan: null };
    const modal = document.getElementById('activityModal');
    const titleEl = document.getElementById('activityModalTitle');
    const actTitleInput = document.getElementById('modalActTitle');
    const actTypeSelect = document.getElementById('modalActType');
    const actDurSelect = document.getElementById('modalActDuration');
    const insertWrap = document.getElementById('modalInsertPosWrap');
    const adjustBtn = document.getElementById('activityModalAdjustSaveBtn');

    // Build 15-min duration options up to sched.duration
    const options = [];
    for (let m = 15; m <= Math.max(15, sched.duration); m += 15) {
      options.push(`<option value="${m}">${formatDuration(m)} (${m}분)</option>`);
    }
    // Also add one over-budget option just so user can test/see explicit block if sched.duration < 240
    if (sched.duration < 240) {
      const over = sched.duration + 15;
      options.push(`<option value="${over}">${formatDuration(over)} (${over}분 · 공강 초과 테스트)</option>`);
    }
    actDurSelect.innerHTML = options.join('');

    if (mode === 'edit') {
      const act = sched.activities.find(a => a.id === activityId);
      if (!act) return;
      titleEl.textContent = '활동 수정';
      actTitleInput.value = act.title;
      actTypeSelect.value = act.type;
      actDurSelect.value = String(act.duration);
      insertWrap.style.display = 'none';
    } else {
      titleEl.textContent = '새 활동 추가';
      actTitleInput.value = '';
      actTypeSelect.value = '공부';
      const { freeMinutes } = computeCategoryTotals(sched);
      actDurSelect.value = String(freeMinutes >= 15 ? Math.min(30, freeMinutes) : 15);
      insertWrap.style.display = 'flex';
    }

    adjustBtn.style.display = 'none';
    evaluateModalBudget();
    modal.classList.add('is-open');
    setTimeout(() => actTitleInput.focus(), 50);
  }

  function evaluateModalBudget() {
    const sched = getActiveSchedule();
    if (!sched || !modalContext) return;

    const durSelect = document.getElementById('modalActDuration');
    const newDur = Number(durSelect.value);
    const budgetInfo = document.getElementById('modalBudgetInfo');
    const conflictBox = document.getElementById('modalConflictBox');
    const saveBtn = document.getElementById('activityModalSaveBtn');
    const adjustBtn = document.getElementById('activityModalAdjustSaveBtn');

    const { assignedMinutes, freeMinutes } = computeCategoryTotals(sched);
    let delta = newDur;
    if (modalContext.mode === 'edit') {
      const act = sched.activities.find(a => a.id === modalContext.activityId);
      delta = newDur - (act ? act.duration : 0);
    }

    budgetInfo.textContent = `전체 공강시간: ${formatDuration(sched.duration)} · 현재 배정: ${formatDuration(assignedMinutes)} · 남은 여유 시간: ${formatDuration(freeMinutes)}`;

    modalContext.pendingAdjustedPlan = null;

    if (newDur > sched.duration) {
      conflictBox.style.display = 'flex';
      conflictBox.className = 'notice-box notice-danger';
      conflictBox.textContent = `전체 공강시간(${formatDuration(sched.duration)})을 초과하는 시간은 저장할 수 없습니다.`;
      saveBtn.disabled = true;
      adjustBtn.style.display = 'none';
      return;
    }

    if (delta <= freeMinutes) {
      conflictBox.style.display = 'none';
      saveBtn.disabled = false;
      adjustBtn.style.display = 'none';
      return;
    }

    // Needs more time than freeMinutes
    const shortage = delta - freeMinutes;
    const plan = computeAutoTrimPlan(sched, modalContext.activityId, shortage);
    if (plan.possible) {
      modalContext.pendingAdjustedPlan = plan;
      conflictBox.style.display = 'flex';
      conflictBox.className = 'notice-box notice-warn';
      conflictBox.innerHTML = `<div><strong>여유 시간(${formatDuration(freeMinutes)})이 ${formatDuration(shortage)} 부족합니다.</strong><br>공강시간을 초과하지 않도록 아래 활동을 자동 조정하여 맞출 수 있어요:<br>• ${plan.summaryLines.map(escapeHtml).join('<br>• ')}</div>`;
      saveBtn.disabled = true;
      adjustBtn.style.display = 'inline-flex';
    } else {
      conflictBox.style.display = 'flex';
      conflictBox.className = 'notice-box notice-danger';
      conflictBox.textContent = `여유 시간이 부족하고 다른 활동도 더 줄일 수 없어 ${formatDuration(newDur)}로 변경할 수 없습니다. 다른 활동을 먼저 줄이거나 삭제해 주세요.`;
      saveBtn.disabled = true;
      adjustBtn.style.display = 'none';
    }
  }

  function saveActivityModal(useAutoAdjust) {
    const sched = getActiveSchedule();
    if (!sched || !modalContext) return;

    const title = document.getElementById('modalActTitle').value.trim();
    const type = document.getElementById('modalActType').value;
    const duration = Number(document.getElementById('modalActDuration').value);

    if (!title) {
      showToast('활동 내용을 입력해 주세요.', 'warn');
      return;
    }
    if (duration > sched.duration || duration < 15 || duration % 15 !== 0) {
      showToast('전체 공강시간을 초과하거나 올바르지 않은 시간입니다.', 'error');
      return;
    }

    const { freeMinutes } = computeCategoryTotals(sched);
    let delta = duration;
    if (modalContext.mode === 'edit') {
      const act = sched.activities.find(a => a.id === modalContext.activityId);
      if (!act) return;
      delta = duration - act.duration;
    }

    if (delta > freeMinutes) {
      if (!useAutoAdjust || !modalContext.pendingAdjustedPlan || !modalContext.pendingAdjustedPlan.possible) {
        showToast('여유 시간이 부족해 저장할 수 없습니다.', 'error');
        return;
      }
      sched.activities = modalContext.pendingAdjustedPlan.adjustedActivities;
    }

    if (modalContext.mode === 'edit') {
      const act = sched.activities.find(a => a.id === modalContext.activityId);
      if (!act) return;
      act.title = title;
      act.type = type;
      act.duration = duration;
      // If this activity's timer is currently active and duration changed, reset idle or notify
      if (state.timer.scheduleId === sched.id && state.timer.activityId === act.id && state.timer.status !== 'idle') {
        resetActiveTimer(true);
        showToast('수정된 시간에 맞춰 실행 중이던 타이머를 초기화했습니다.', 'warn');
      }
      finalizeScheduleMutation(sched, '활동 수정 저장');
      showToast('활동 내용을 수정하고 이후 일정을 자동 재계산했어요.');
    } else {
      const insertPos = document.getElementById('modalInsertPos').value;
      const newAct = {
        id: generateUniqueId('act'),
        goalTag: type,
        type,
        duration,
        title,
        reason: '사용자가 직접 추가한 맞춤 활동입니다.',
        completed: false
      };
      if (insertPos === 'start') {
        sched.activities.unshift(newAct);
      } else {
        sched.activities.push(newAct);
      }
      finalizeScheduleMutation(sched, '활동 추가 저장');
      showToast('새 활동을 추가하고 시간을 자동 계산했어요.');
    }

    closeModal('activityModal');
  }

  function requestDeleteActivity(actId) {
    const sched = getActiveSchedule();
    if (!sched) return;
    const act = sched.activities.find(a => a.id === actId);
    if (!act) return;

    const hasOthers = sched.activities.length > 1;
    const footBtns = [
      {
        label: '취소',
        cls: 'btn btn-secondary btn-sm',
        onClick: () => closeModal('confirmModal')
      },
      {
        label: '삭제 (여유 시간으로 남기기)',
        cls: 'btn btn-danger-soft btn-sm',
        onClick: () => {
          performDeleteActivity(actId, false);
          closeModal('confirmModal');
        }
      }
    ];

    if (hasOthers) {
      footBtns.push({
        label: '삭제 후 남은 활동에 자동 배분',
        cls: 'btn btn-primary btn-sm',
        onClick: () => {
          performDeleteActivity(actId, true);
          closeModal('confirmModal');
        }
      });
    }

    openConfirmModal(
      '활동 삭제 확인',
      `'${act.title}' (${formatDuration(act.duration)}) 일정을 삭제할까요? 삭제 후 나머지 활동의 시작·종료 시간이 자동으로 재계산됩니다.`,
      footBtns
    );
  }

  function performDeleteActivity(actId, autoRedistribute) {
    const sched = getActiveSchedule();
    if (!sched) return;
    const idx = sched.activities.findIndex(a => a.id === actId);
    if (idx === -1) return;
    const removed = sched.activities.splice(idx, 1)[0];

    if (state.timer.scheduleId === sched.id && state.timer.activityId === actId) {
      resetActiveTimer(true);
    }

    if (autoRedistribute && sched.activities.length > 0) {
      let targetIdx = sched.activities.findIndex(a => a.type !== '이동 및 준비');
      if (targetIdx === -1) targetIdx = 0;
      sched.activities[targetIdx].duration += removed.duration;
    }

    finalizeScheduleMutation(sched, '활동 삭제 저장');
    showToast(autoRedistribute ? '삭제 후 남은 활동에 시간을 합쳐 재구성했어요.' : '활동을 삭제하고 시간표를 재구성했어요.');
  }

  /* ==================== REAL-TIME TIMER ENGINE ==================== */
  function unlockAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      // Ignore environments without Web Audio
    }
  }

  function playCompletionChime() {
    try {
      unlockAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.16);
        gain.gain.setValueAtTime(0.001, now + i * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.42);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.16);
        osc.stop(now + i * 0.16 + 0.45);
      });
    } catch (e) {
      // Safe fallback if audio blocked
    }
  }

  function computeLiveRemainingSeconds() {
    if (state.timer.status === 'running' && state.timer.endTimestamp) {
      return Math.max(0, Math.ceil((state.timer.endTimestamp - Date.now()) / 1000));
    }
    return Math.max(0, state.timer.remainingSeconds || 0);
  }

  function startActivityTimer(actId) {
    const sched = getActiveSchedule();
    if (!sched) return;
    const act = sched.activities.find(a => a.id === actId);
    if (!act) return;

    unlockAudio();

    // Clear handling if another timer is running or paused
    if (state.timer.status === 'running' || state.timer.status === 'paused') {
      if (state.timer.activityId !== actId) {
        const prevSched = state.schedules.find(s => s.id === state.timer.scheduleId);
        const prevAct = prevSched ? prevSched.activities.find(a => a.id === state.timer.activityId) : null;
        if (prevAct) {
          showToast(`기존 '${prevAct.title}' 타이머를 종료하고 '${act.title}' 타이머를 시작했어요.`, 'warn');
        }
      }
    }

    const totalSec = act.duration * 60;
    state.timer = {
      scheduleId: sched.id,
      activityId: act.id,
      status: 'running',
      durationSeconds: totalSec,
      remainingSeconds: totalSec,
      endTimestamp: Date.now() + totalSec * 1000
    };
    persistTimer();
    ensureTimerTicker();
    renderResultView();
  }

  function pauseActiveTimer() {
    if (state.timer.status !== 'running') return;
    const rem = computeLiveRemainingSeconds();
    state.timer.status = 'paused';
    state.timer.remainingSeconds = rem;
    state.timer.endTimestamp = null;
    persistTimer();
    stopTimerTicker();
    renderResultView();
  }

  function resumeActiveTimer() {
    if (state.timer.status !== 'paused') return;
    unlockAudio();
    const rem = Math.max(1, state.timer.remainingSeconds);
    state.timer.status = 'running';
    state.timer.endTimestamp = Date.now() + rem * 1000;
    persistTimer();
    ensureTimerTicker();
    renderResultView();
  }

  function resetActiveTimer(silent) {
    stopTimerTicker();
    state.timer = {
      scheduleId: null,
      activityId: null,
      status: 'idle',
      durationSeconds: 0,
      remainingSeconds: 0,
      endTimestamp: null
    };
    persistTimer();
    if (!silent) {
      renderResultView();
      showToast('타이머를 원래 설정 시간으로 초기화했어요.');
    }
  }

  function ensureTimerTicker() {
    stopTimerTicker();
    if (state.timer.status === 'running') {
      timerIntervalHandle = setInterval(tickTimer, 250);
      tickTimer();
    }
  }

  function stopTimerTicker() {
    if (timerIntervalHandle) {
      clearInterval(timerIntervalHandle);
      timerIntervalHandle = null;
    }
  }

  function tickTimer() {
    if (state.timer.status !== 'running') return;
    const rem = computeLiveRemainingSeconds();
    state.timer.remainingSeconds = rem;

    if (rem <= 0) {
      handleTimerFinished();
      return;
    }
    syncTimerClocksOnly(rem);
  }

  function syncTimerClocksOnly(remSeconds) {
    const formatted = formatSecondsMMSS(remSeconds);
    const barClock = document.getElementById('timerBarClock');
    if (barClock) barClock.textContent = formatted;
    if (state.timer.activityId) {
      const cardClock = document.querySelector(`[data-timer-clock="${state.timer.activityId}"]`);
      if (cardClock) cardClock.textContent = formatted;
    }
  }

  function syncTimerUIFromState() {
    const bar = document.getElementById('activeTimerBar');
    const activeSched = getActiveSchedule();
    const isActiveInCurrent = activeSched && state.timer.scheduleId === activeSched.id;

    if (!isActiveInCurrent || state.timer.status === 'idle' || state.timer.status === 'ended') {
      bar.classList.remove('is-visible');
      return;
    }

    const act = activeSched.activities.find(a => a.id === state.timer.activityId);
    if (!act) {
      bar.classList.remove('is-visible');
      return;
    }

    const rem = computeLiveRemainingSeconds();
    bar.classList.add('is-visible');
    document.getElementById('timerBarTitle').textContent = act.title;
    document.getElementById('timerBarClock').textContent = formatSecondsMMSS(rem);
    const dot = document.getElementById('timerBarDot');
    const label = document.getElementById('timerBarStatusLabel');
    const toggleBtn = document.getElementById('timerBarToggleBtn');

    if (state.timer.status === 'running') {
      dot.classList.add('is-pulsing');
      label.textContent = '타이머 실행 중';
      toggleBtn.textContent = '일시정지';
    } else {
      dot.classList.remove('is-pulsing');
      label.textContent = '타이머 일시정지됨';
      toggleBtn.textContent = '재개';
    }
  }

  function handleTimerFinished() {
    stopTimerTicker();
    const finishedSched = state.schedules.find(s => s.id === state.timer.scheduleId);
    const finishedIdx = finishedSched
      ? finishedSched.activities.findIndex(a => a.id === state.timer.activityId)
      : -1;
    const finishedAct = finishedIdx !== -1 ? finishedSched.activities[finishedIdx] : null;
    const nextAct = (finishedSched && finishedIdx !== -1 && finishedIdx + 1 < finishedSched.activities.length)
      ? finishedSched.activities[finishedIdx + 1]
      : null;

    state.timer.status = 'ended';
    state.timer.remainingSeconds = 0;
    state.timer.endTimestamp = null;
    persistTimer();

    playCompletionChime();

    if (state.activeView === 'result') {
      renderResultView();
    }

    showTimerCompleteModal(finishedAct, nextAct);
  }

  function showTimerCompleteModal(finishedAct, nextAct) {
    const modal = document.getElementById('timerAlertModal');
    const nameEl = document.getElementById('timerAlertFinishedName');
    const nextBox = document.getElementById('timerAlertNextBox');
    const nextBtn = document.getElementById('timerAlertNextBtn');

    nameEl.textContent = finishedAct
      ? `'${finishedAct.title}' (${formatDuration(finishedAct.duration)}) 타이머가 끝났어요.`
      : '설정한 활동 시간이 종료되었습니다.';

    if (nextAct) {
      nextBox.innerHTML = `<span>➡️</span><span><strong>다음 활동:</strong> ${escapeHtml(nextAct.title)}<br>시작 시간: ${nextAct.startTime} ~ ${nextAct.endTime} (${formatDuration(nextAct.duration)})</span>`;
      nextBtn.style.display = 'inline-flex';
      nextBtn.dataset.nextId = nextAct.id;
    } else {
      nextBox.innerHTML = `<span>🎉</span><span>이번 공강 시간표의 마지막 활동까지 모두 마쳤어요!</span>`;
      nextBtn.style.display = 'none';
      delete nextBtn.dataset.nextId;
    }

    modal.classList.add('is-open');
  }

  /* ==================== RENDER: HISTORY VIEW ==================== */
  function renderHistoryView() {
    const listEl = document.getElementById('historyList');
    const statsEl = document.getElementById('historyStatsSummary');
    const bannerEl = document.getElementById('sameWeekdayHistoryBanner');
    const bannerText = document.getElementById('sameWeekdayHistoryText');
    const reuseBtn = document.getElementById('sameWeekdayReuseBtn');

    const todayStr = getTodayLocalDateStr();
    const todayWeekday = getWeekdayKo(todayStr);

    // Find latest schedule matching today's weekday (preferring an older date, or any)
    const matchingWeekdayList = state.schedules
      .filter(s => s.dayOfWeek === todayWeekday)
      .sort((a, b) => (b.lastModifiedMs || 0) - (a.lastModifiedMs || 0));

    if (matchingWeekdayList.length > 0) {
      const sample = matchingWeekdayList[0];
      bannerEl.style.display = 'flex';
      bannerText.innerHTML = `<strong>${todayWeekday}요일 시간표 빠른 불러오기:</strong> '${formatKoreanDate(sample.date)}'에 사용한 시간표(${formatDuration(sample.duration)}, ${sample.goals.join('·')})를 오늘(${formatKoreanDate(todayStr)}) 일정으로 복사할 수 있어요!`;
      reuseBtn.dataset.schedId = sample.id;
    } else {
      bannerEl.style.display = 'none';
    }

    document.querySelectorAll('#weekdayFilterRow .chip-btn').forEach(btn => {
      btn.classList.toggle('is-selected', btn.dataset.weekday === state.historyWeekdayFilter);
    });

    const sorted = [...state.schedules].sort((a, b) => (b.lastModifiedMs || 0) - (a.lastModifiedMs || 0));
    const filtered = state.historyWeekdayFilter === 'all'
      ? sorted
      : sorted.filter(s => s.dayOfWeek === state.historyWeekdayFilter);

    const avgRate = sorted.length > 0
      ? Math.round(sorted.reduce((acc, s) => acc + computeProgress(s.activities).percent, 0) / sorted.length)
      : 0;
    statsEl.textContent = `저장된 시간표 ${sorted.length}개 · 평균 달성률 ${avgRate}%`;

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🗂️</div>
          <h3>${state.historyWeekdayFilter === 'all' ? '아직 저장된 시간표 기록이 없어요' : `${state.historyWeekdayFilter}요일에 저장된 시간표가 없어요`}</h3>
          <p>공강 일정을 만들면 자동으로 저장되어 언제든 다시 불러와 쓸 수 있습니다.</p>
          <button type="button" class="btn btn-primary" id="historyEmptyCreateBtn">첫 공강 시간표 만들기</button>
        </div>
      `;
      const btn = document.getElementById('historyEmptyCreateBtn');
      if (btn) btn.addEventListener('click', () => switchView('input'));
      return;
    }

    listEl.innerHTML = filtered.map(sched => {
      const prog = computeProgress(sched.activities);
      const doneList = sched.activities.filter(a => a.completed);
      const todoList = sched.activities.filter(a => !a.completed);
      const endInfo = addMinutesToTime(sched.startTime, sched.duration);
      const endStr = endInfo.dayOffset > 0 ? `+${endInfo.dayOffset}일 ${endInfo.hhmm}` : endInfo.hhmm;

      return `
        <article class="history-card" data-history-id="${sched.id}">
          <div class="history-card-top">
            <div>
              <h3 class="history-date-title">${formatKoreanDate(sched.date)} · ${sched.startTime} ~ ${endStr} (${formatDuration(sched.duration)})</h3>
              <p class="history-meta">
                📍 ${escapeHtml(sched.location)} · 🔋 ${escapeHtml(sched.condition)} · 🎯 ${sched.goals.map((g, i) => `${i + 1}순위 ${g}`).join(' > ')}
              </p>
            </div>
            <span class="history-progress-badge">달성률 ${prog.percent}% (${prog.completedCount}/${prog.totalCount})</span>
          </div>

          <div class="progress-track" style="height: 8px;">
            <div class="progress-fill" style="width: ${prog.percent}%;"></div>
          </div>

          <div class="history-tasks-split">
            <div class="history-task-col">
              <h4>✅ 완료한 활동 (${doneList.length})</h4>
              <ul>
                ${doneList.length > 0
                  ? doneList.map(a => `<li>${a.startTime} ${escapeHtml(a.title)} (${formatDuration(a.duration)})</li>`).join('')
                  : '<li style="color:var(--text-muted); list-style:none;">아직 완료한 활동이 없어요.</li>'}
              </ul>
            </div>
            <div class="history-task-col">
              <h4>⏳ 미완료 활동 (${todoList.length})</h4>
              <ul>
                ${todoList.length > 0
                  ? todoList.map(a => `<li>${a.startTime} ${escapeHtml(a.title)} (${formatDuration(a.duration)})</li>`).join('')
                  : '<li style="color:var(--mint-600); list-style:none;">모든 활동을 완료했어요!</li>'}
              </ul>
            </div>
          </div>

          <div class="history-card-foot">
            <span class="history-updated">마지막 수정: ${escapeHtml(sched.lastModified || '-')}</span>
            <div class="history-actions">
              <button type="button" class="btn btn-secondary btn-xs hist-load-btn" data-id="${sched.id}">불러와 이어하기</button>
              <button type="button" class="btn btn-soft btn-xs hist-reuse-today-btn" data-id="${sched.id}">오늘 날짜로 복사 재사용</button>
              <button type="button" class="btn btn-danger-soft btn-xs hist-delete-btn" data-id="${sched.id}">삭제</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function loadHistoryScheduleAsActive(schedId) {
    const found = state.schedules.find(s => s.id === schedId);
    if (!found) return;
    state.activeScheduleId = found.id;
    safeSetStorage(STORAGE_KEY_ACTIVE_ID, found.id);
    switchView('result');
    showToast(`${formatKoreanDate(found.date)} 시간표를 불러왔어요.`);
  }

  function cloneScheduleToDate(schedId, targetDateStr) {
    const source = state.schedules.find(s => s.id === schedId);
    if (!source) return;
    const clonedActivities = source.activities.map(a => ({
      ...a,
      id: generateUniqueId('act'),
      completed: false
    }));
    const cloned = {
      ...source,
      id: generateUniqueId('sched'),
      date: targetDateStr,
      dayOfWeek: getWeekdayKo(targetDateStr),
      activities: computeTimelineTimes(source.startTime, clonedActivities),
      lastModified: formatLocalTimestampNow(),
      lastModifiedMs: Date.now()
    };
    cloned.progress = computeProgress(cloned.activities);

    // Insert as new record without overwriting source!
    state.schedules.unshift(cloned);
    state.activeScheduleId = cloned.id;
    persistSchedules('새 날짜로 복사 저장');
    switchView('result');
    showToast(`${formatKoreanDate(source.date)} 시간표를 ${formatKoreanDate(targetDateStr)} 새 일정으로 복사했어요.`);
  }

  function requestDeleteHistory(schedId) {
    const target = state.schedules.find(s => s.id === schedId);
    if (!target) return;
    openConfirmModal(
      '저장된 시간표 삭제',
      `${formatKoreanDate(target.date)} (${target.startTime}, ${formatDuration(target.duration)}) 기록을 영구적으로 삭제할까요?`,
      [
        {
          label: '취소',
          cls: 'btn btn-secondary btn-sm',
          onClick: () => closeModal('confirmModal')
        },
        {
          label: '삭제하기',
          cls: 'btn btn-danger-soft btn-sm',
          onClick: () => {
            if (state.timer.scheduleId === schedId) {
              resetActiveTimer(true);
            }
            state.schedules = state.schedules.filter(s => s.id !== schedId);
            if (state.activeScheduleId === schedId) {
              state.activeScheduleId = state.schedules.length > 0 ? state.schedules[0].id : null;
            }
            persistSchedules('기록 삭제 저장');
            renderHistoryView();
            closeModal('confirmModal');
            showToast('선택한 시간표 기록을 삭제했어요.');
          }
        }
      ]
    );
  }

  /* ==================== MODALS & ESCAPING ==================== */
  function openConfirmModal(title, message, buttons) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    const foot = document.getElementById('confirmModalFoot');
    foot.innerHTML = '';
    buttons.forEach(cfg => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cfg.cls;
      b.textContent = cfg.label;
      b.addEventListener('click', cfg.onClick);
      foot.appendChild(b);
    });
    document.getElementById('confirmModal').classList.add('is-open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-open');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ==================== EVENT WIRING ==================== */
  function bindEvents() {
    // Header navigation
    document.getElementById('brandHomeBtn').addEventListener('click', () => switchView('home'));
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Home buttons
    document.getElementById('startPlanBtn').addEventListener('click', () => switchView('input'));
    document.getElementById('homeResumeBtn').addEventListener('click', () => switchView('result'));
    document.getElementById('homeHistoryBtn').addEventListener('click', () => switchView('history'));

    // Input View: Date & Time
    document.getElementById('gapDateInput').addEventListener('change', (e) => {
      state.input.date = e.target.value;
      updateDatePreviewUI();
      renderSameWeekdayHintOnInput();
      persistDraft();
    });
    document.getElementById('setTodayDateBtn').addEventListener('click', () => {
      state.input.date = getTodayLocalDateStr();
      document.getElementById('gapDateInput').value = state.input.date;
      updateDatePreviewUI();
      renderSameWeekdayHintOnInput();
      persistDraft();
    });

    document.getElementById('gapStartTimeInput').addEventListener('input', (e) => {
      state.input.startTime = e.target.value;
      updateStartTimePreviewUI();
      persistDraft();
    });
    document.getElementById('setCurrentTimeBtn').addEventListener('click', () => {
      state.input.startTime = getCurrentLocalTimeStr();
      document.getElementById('gapStartTimeInput').value = state.input.startTime;
      updateStartTimePreviewUI();
      persistDraft();
    });
    document.querySelectorAll('.start-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.input.startTime = btn.dataset.time;
        document.getElementById('gapStartTimeInput').value = state.input.startTime;
        updateStartTimePreviewUI();
        persistDraft();
      });
    });

    // Input View: Duration Slider, Tick Labels & Quick Buttons
    const slider = document.getElementById('durationSlider');
    slider.addEventListener('input', (e) => {
      syncDurationUI(Number(e.target.value));
      persistDraft();
    });
    slider.addEventListener('change', (e) => {
      syncDurationUI(Number(e.target.value));
      persistDraft();
    });

    document.getElementById('quickDurationGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('.dur-btn');
      if (!btn) return;
      syncDurationUI(Number(btn.dataset.minutes));
      persistDraft();
    });

    document.getElementById('sliderLabelsFrame').addEventListener('click', (e) => {
      const lbl = e.target.closest('.slider-tick-label');
      if (!lbl) return;
      syncDurationUI(Number(lbl.dataset.minutes));
      persistDraft();
    });

    // Input View: Location & Condition
    document.getElementById('locationOptions').addEventListener('click', (e) => {
      const card = e.target.closest('.choice-card');
      if (!card) return;
      state.input.location = card.dataset.location;
      renderChoiceSelections();
      updateSubmitSummaryUI();
      persistDraft();
    });

    document.getElementById('conditionOptions').addEventListener('click', (e) => {
      const card = e.target.closest('.choice-card');
      if (!card) return;
      state.input.condition = card.dataset.condition;
      renderChoiceSelections();
      updateSubmitSummaryUI();
      persistDraft();
    });

    // Input View: Multi-select Goals & Priorities
    document.getElementById('goalsGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('.goal-toggle');
      if (!btn) return;
      const goal = btn.dataset.goal;
      const idx = state.input.goals.indexOf(goal);
      if (idx === -1) {
        state.input.goals.push(goal);
      } else {
        state.input.goals.splice(idx, 1);
      }
      renderGoalsAndPriorityUI();
      persistDraft();
    });

    document.getElementById('priorityList').addEventListener('click', (e) => {
      const upBtn = e.target.closest('.move-priority-up');
      const downBtn = e.target.closest('.move-priority-down');
      if (upBtn) {
        const idx = Number(upBtn.dataset.idx);
        if (idx > 0) {
          const tmp = state.input.goals[idx - 1];
          state.input.goals[idx - 1] = state.input.goals[idx];
          state.input.goals[idx] = tmp;
          renderGoalsAndPriorityUI();
          persistDraft();
        }
      } else if (downBtn) {
        const idx = Number(downBtn.dataset.idx);
        if (idx < state.input.goals.length - 1) {
          const tmp = state.input.goals[idx + 1];
          state.input.goals[idx + 1] = state.input.goals[idx];
          state.input.goals[idx] = tmp;
          renderGoalsAndPriorityUI();
          persistDraft();
        }
      }
    });

    // Input View: Memo
    document.getElementById('memoInput').addEventListener('input', (e) => {
      state.input.memo = e.target.value;
      persistDraft();
    });
    document.querySelectorAll('.memo-example-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.input.memo = btn.dataset.memo;
        document.getElementById('memoInput').value = state.input.memo;
        persistDraft();
      });
    });
    document.getElementById('clearMemoBtn').addEventListener('click', () => {
      state.input.memo = '';
      document.getElementById('memoInput').value = '';
      persistDraft();
    });

    // Input View: History & Reuse
    document.getElementById('inputToHistoryBtn').addEventListener('click', () => switchView('history'));
    document.getElementById('reuseWeekdayQuickBtn').addEventListener('click', () => {
      const weekday = getWeekdayKo(state.input.date);
      const match = state.schedules.find(s => s.dayOfWeek === weekday);
      if (match) {
        cloneScheduleToDate(match.id, state.input.date);
      }
    });

    // Generate Schedule Submit
    document.getElementById('generateScheduleBtn').addEventListener('click', () => {
      if (!validateInputs()) return;
      state.variationSeed += 1;
      const newSched = buildScheduleFromInput(state.input, state.variationSeed);
      state.schedules.unshift(newSched);
      state.activeScheduleId = newSched.id;
      persistSchedules('새 시간표 자동 저장');
      switchView('result');
      showToast('맞춤 공강 시간표를 생성하고 저장했어요!');
    });

    // Result View: Empty State & Top Actions
    document.getElementById('emptyToInputBtn').addEventListener('click', () => switchView('input'));
    document.getElementById('emptyToHistoryBtn').addEventListener('click', () => switchView('history'));

    document.getElementById('editInputsBtn').addEventListener('click', () => {
      const sched = getActiveSchedule();
      if (sched) {
        state.input = {
          date: sched.date,
          startTime: sched.startTime,
          duration: sched.duration,
          location: sched.location,
          condition: sched.condition,
          goals: [...sched.goals],
          memo: sched.memo || ''
        };
        persistDraft();
      }
      switchView('input');
    });

    document.getElementById('resultToHistoryBtn').addEventListener('click', () => switchView('history'));

    document.getElementById('rerollScheduleBtn').addEventListener('click', () => {
      const current = getActiveSchedule();
      const sourceInput = current ? {
        date: current.date,
        startTime: current.startTime,
        duration: current.duration,
        location: current.location,
        condition: current.condition,
        goals: [...current.goals],
        memo: current.memo || ''
      } : state.input;

      state.variationSeed += 1;
      const altSched = buildScheduleFromInput(sourceInput, state.variationSeed);
      // Create a new distinct record so past saved schedules are NEVER overwritten
      state.schedules.unshift(altSched);
      state.activeScheduleId = altSched.id;
      if (state.timer.status !== 'idle') {
        resetActiveTimer(true);
      }
      persistSchedules('새 추천 조합 저장');
      renderResultView();
      showToast('새로운 활동 조합으로 추천해 드렸어요! (기존 기록은 안전하게 보존됩니다)');
    });

    document.getElementById('addActivityBtn').addEventListener('click', () => openActivityModal('add'));
    document.getElementById('changeStartTimeBtn').addEventListener('click', () => {
      const sched = getActiveSchedule();
      if (!sched) return;
      document.getElementById('modalNewStartTime').value = sched.startTime;
      document.getElementById('startTimeModal').classList.add('is-open');
    });
    document.getElementById('startTimeModalClose').addEventListener('click', () => closeModal('startTimeModal'));
    document.getElementById('startTimeModalCancel').addEventListener('click', () => closeModal('startTimeModal'));
    document.getElementById('startTimeModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const sched = getActiveSchedule();
      const newTime = document.getElementById('modalNewStartTime').value;
      if (!sched || !/^\d{2}:\d{2}$/.test(newTime)) {
        showToast('올바른 시작 시간을 선택해 주세요.', 'warn');
        return;
      }
      sched.startTime = newTime;
      finalizeScheduleMutation(sched, '시작 시간 변경 저장');
      closeModal('startTimeModal');
      showToast(`시작 시간을 ${formatKoreanTime(newTime)}으로 변경하고 전체 일정을 재계산했어요.`);
    });

    // Sticky Timer Bar Buttons
    document.getElementById('timerBarToggleBtn').addEventListener('click', () => {
      if (state.timer.status === 'running') {
        pauseActiveTimer();
      } else if (state.timer.status === 'paused') {
        resumeActiveTimer();
      }
    });
    document.getElementById('timerBarResetBtn').addEventListener('click', () => resetActiveTimer(false));

    // Timeline Card Delegated Events
    document.getElementById('timelineList').addEventListener('click', (e) => {
      const checkBtn = e.target.closest('.act-toggle-done');
      if (checkBtn) {
        toggleActivityDone(checkBtn.dataset.id);
        return;
      }
      const startBtn = e.target.closest('.act-timer-start');
      if (startBtn) {
        startActivityTimer(startBtn.dataset.id);
        return;
      }
      const pauseBtn = e.target.closest('.act-timer-pause');
      if (pauseBtn) {
        pauseActiveTimer();
        return;
      }
      const resumeBtn = e.target.closest('.act-timer-resume');
      if (resumeBtn) {
        resumeActiveTimer();
        return;
      }
      const resetBtn = e.target.closest('.act-timer-reset');
      if (resetBtn) {
        resetActiveTimer(false);
        return;
      }
      const upBtn = e.target.closest('.act-move-up');
      if (upBtn) {
        moveActivityOrder(Number(upBtn.dataset.idx), -1);
        return;
      }
      const downBtn = e.target.closest('.act-move-down');
      if (downBtn) {
        moveActivityOrder(Number(downBtn.dataset.idx), 1);
        return;
      }
      const editBtn = e.target.closest('.act-edit-btn');
      if (editBtn) {
        openActivityModal('edit', editBtn.dataset.id);
        return;
      }
      const delBtn = e.target.closest('.act-delete-btn');
      if (delBtn) {
        requestDeleteActivity(delBtn.dataset.id);
      }
    });

    // Activity Modal Events
    document.getElementById('activityModalClose').addEventListener('click', () => closeModal('activityModal'));
    document.getElementById('activityModalCancel').addEventListener('click', () => closeModal('activityModal'));
    document.getElementById('modalActDuration').addEventListener('change', evaluateModalBudget);
    document.getElementById('activityModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      saveActivityModal(false);
    });
    document.getElementById('activityModalAdjustSaveBtn').addEventListener('click', () => saveActivityModal(true));

    // Confirm Modal Close
    document.getElementById('confirmModalClose').addEventListener('click', () => closeModal('confirmModal'));

    // Timer Alert Modal Events
    document.getElementById('timerAlertClose').addEventListener('click', () => closeModal('timerAlertModal'));
    document.getElementById('timerAlertOkBtn').addEventListener('click', () => closeModal('timerAlertModal'));
    document.getElementById('timerAlertNextBtn').addEventListener('click', (e) => {
      const nextId = e.currentTarget.dataset.nextId;
      closeModal('timerAlertModal');
      if (nextId) {
        const card = document.querySelector(`[data-act-id="${nextId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.boxShadow = '0 0 0 3px var(--mint-500)';
          setTimeout(() => { card.style.boxShadow = ''; }, 1800);
        }
      }
    });

    // Close modals on backdrop click or Escape
    ['activityModal', 'confirmModal', 'timerAlertModal', 'startTimeModal'].forEach(id => {
      document.getElementById(id).addEventListener('click', (e) => {
        if (e.target.id === id) closeModal(id);
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal('activityModal');
        closeModal('confirmModal');
        closeModal('timerAlertModal');
        closeModal('startTimeModal');
      }
    });

    // History View Events
    document.getElementById('historyNewPlanBtn').addEventListener('click', () => switchView('input'));
    document.getElementById('sameWeekdayReuseBtn').addEventListener('click', (e) => {
      const schedId = e.currentTarget.dataset.schedId;
      if (schedId) cloneScheduleToDate(schedId, getTodayLocalDateStr());
    });

    document.getElementById('weekdayFilterRow').addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (!btn) return;
      state.historyWeekdayFilter = btn.dataset.weekday;
      renderHistoryView();
    });

    document.getElementById('historyList').addEventListener('click', (e) => {
      const loadBtn = e.target.closest('.hist-load-btn');
      if (loadBtn) {
        loadHistoryScheduleAsActive(loadBtn.dataset.id);
        return;
      }
      const reuseBtn = e.target.closest('.hist-reuse-today-btn');
      if (reuseBtn) {
        cloneScheduleToDate(reuseBtn.dataset.id, getTodayLocalDateStr());
        return;
      }
      const delBtn = e.target.closest('.hist-delete-btn');
      if (delBtn) {
        requestDeleteHistory(delBtn.dataset.id);
      }
    });

    // Visibility change: immediately re-sync live timer if tab wakes up
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.timer.status === 'running') {
        tickTimer();
      }
    });
  }

  /* ==================== INITIALIZATION ==================== */
  function init() {
    loadAllFromStorage();
    bindEvents();
    updateBadges();

    const savedView = safeGetStorage(STORAGE_KEY_VIEW);
    const validViews = ['home', 'input', 'result', 'history'];
    let initialView = validViews.includes(savedView) ? savedView : 'home';
    if (initialView === 'result' && !getActiveSchedule()) {
      initialView = 'home';
    }
    switchView(initialView);

    // Check persisted running timer on reload
    if (state.timer.status === 'running') {
      const rem = computeLiveRemainingSeconds();
      if (rem <= 0) {
        handleTimerFinished();
      } else {
        ensureTimerTicker();
      }
    }
  }

  init();
})();
