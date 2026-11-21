/* 1. Global State */
    const state = {
      startTime: "13:00",
      duration: 120, // 30 ~ 240
      location: "school", // school, home, transit
      condition: "normal", // tired, normal, energetic
      goal: "study", // study, assignment, exercise, meal, rest, errand
      memo: "",
      scheduleItems: [],
      completedItems: new Set(),
      lastUsedIds: new Set() // For ensuring fresh variety upon re-recommendation
    };

    const locationLabels = {
      school: { label: "학교", icon: "🏫" },
      home: { label: "집", icon: "🏠" },
      transit: { label: "이동 중", icon: "🚌" }
    };

    const conditionLabels = {
      tired: { label: "매우 피곤함", icon: "🥱" },
      normal: { label: "보통", icon: "😊" },
      energetic: { label: "활기참", icon: "⚡" }
    };

    const goalLabels = {
      study: { label: "공부", icon: "📖" },
      assignment: { label: "과제", icon: "💻" },
      exercise: { label: "운동", icon: "🏃‍♂️" },
      meal: { label: "식사", icon: "🍱" },
      rest: { label: "휴식", icon: "🛋️" },
      errand: { label: "개인 용무", icon: "📋" }
    };

    /* 2. Screen Navigation (Immediate Top Reset without Lag/Gap) */
    function goToScreen(screenName) {
      document.querySelectorAll(".screen").forEach(el => {
        el.classList.remove("active");
      });
      const target = document.getElementById(`screen-${screenName}`);
      if (target) {
        target.classList.add("active");
      }
      // Instant reset to eliminate any previous screen scroll position
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const appContainer = document.querySelector(".app-container");
      if (appContainer) appContainer.scrollTop = 0;
    }

    /* 3. Input Controls & Event Handlers */
    const startTimeInput = document.getElementById("startTimeInput");
    const timeKoreanDisplay = document.getElementById("timeKoreanDisplay");
    const durationSlider = document.getElementById("durationSlider");
    const durationDisplay = document.getElementById("durationDisplay");
    const durationMinutesDisplay = document.getElementById("durationMinutesDisplay");
    const customMemoInput = document.getElementById("customMemoInput");

    startTimeInput.addEventListener("input", (e) => {
      state.startTime = e.target.value;
      updateTimeKoreanDisplay(e.target.value);
      updateQuickTimeActiveState();
      hideValidationAlert();
    });

    function setTime(timeStr) {
      startTimeInput.value = timeStr;
      state.startTime = timeStr;
      updateTimeKoreanDisplay(timeStr);
      updateQuickTimeActiveState();
      hideValidationAlert();
    }

    function setCurrentTime() {
      const now = new Date();
      let hours = now.getHours();
      let mins = Math.round(now.getMinutes() / 15) * 15;
      if (mins >= 60) {
        hours = (hours + 1) % 24;
        mins = 0;
      }
      const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
      setTime(timeStr);
    }

    function updateTimeKoreanDisplay(timeStr) {
      if (!timeStr) return;
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h < 12 ? "오전" : (h === 12 ? "낮" : "오후");
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m === 0 ? "00" : String(m).padStart(2, "0");
      timeKoreanDisplay.textContent = `${ampm} ${displayH}:${displayM}`;
    }

    function updateQuickTimeActiveState() {
      const val = startTimeInput.value;
      document.querySelectorAll(".time-quick-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("onclick")?.includes(`'${val}'`));
      });
    }

    function handleSliderChange(val) {
      const minutes = parseInt(val, 10);
      state.duration = minutes;
      updateDurationUI(minutes);
    }

    function setPresetDuration(minutes) {
      durationSlider.value = minutes;
      state.duration = minutes;
      updateDurationUI(minutes);
    }

    function updateDurationUI(minutes) {
      const hours = Math.floor(minutes / 60);
      const remainMins = minutes % 60;
      let text = "";
      if (hours > 0 && remainMins > 0) {
        text = `${hours}시간 ${remainMins}분`;
      } else if (hours > 0) {
        text = `${hours}시간`;
      } else {
        text = `${remainMins}분`;
      }
      durationDisplay.textContent = text;
      durationMinutesDisplay.textContent = `(${minutes}분)`;

      document.querySelectorAll(".preset-btn").forEach(btn => {
        const btnMins = parseInt(btn.getAttribute("onclick")?.match(/\d+/)?.[0] || "0", 10);
        btn.classList.toggle("active", btnMins === minutes);
      });
    }

    function selectOption(category, value) {
      state[category] = value;
      const selector = category === "goal" ? ".goal-card" : `#section-${category} .option-card`;
      document.querySelectorAll(selector).forEach(card => {
        card.classList.toggle("selected", card.getAttribute("data-value") === value);
      });
      hideValidationAlert();
    }

    function showValidationAlert(message) {
      const alertBox = document.getElementById("validationAlert");
      const alertText = document.getElementById("validationAlertText");
      alertText.textContent = message;
      alertBox.style.display = "flex";
      alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function hideValidationAlert() {
      document.getElementById("validationAlert").style.display = "none";
    }

    /* ==========================================================================
       4. COMPREHENSIVE ACTIVITY DATABASE (Context-Aware, Location-Strict)
       ========================================================================== */
    const activityDatabase = [
      /* --- STUDY (학교, 집, 이동 중) --- */
      {
        id: "sch_lib_focus",
        title: "도서관 열람실 초집중 전공 공부",
        category: "학업 집중",
        icon: "📚",
        locations: ["school"],
        conditions: ["normal", "energetic"],
        goals: ["study"],
        intensity: "high",
        reason: "학구열 넘치는 도서관 열람실에서 방해 요소 없이 핵심 개념과 문제 풀이를 정복합니다."
      },
      {
        id: "sch_lecture_review",
        title: "오늘 수강한 강의 핵심 노트 단권화",
        category: "강의 복습",
        icon: "✍️",
        locations: ["school"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["study"],
        intensity: "medium",
        reason: "수업 직후 망각 곡선이 가팔라지기 전, 필기를 훑어보며 핵심 키워드를 머릿속에 각인합니다."
      },
      {
        id: "sch_empty_room_exam",
        title: "빈 강의실 기출문제 실전 모의 풀이",
        category: "시험 대비",
        icon: "📝",
        locations: ["school"],
        conditions: ["normal", "energetic"],
        goals: ["study"],
        intensity: "high",
        reason: "실제 시험장과 유사한 빈 강의실 환경에서 타이머를 맞추고 족보와 기출을 격파합니다."
      },
      {
        id: "sch_toeic_listening",
        title: "교내 어학 라운지 토익/오픽 리스닝",
        category: "어학 스터디",
        icon: "🎧",
        locations: ["school"],
        conditions: ["tired", "normal"],
        goals: ["study"],
        intensity: "light",
        reason: "헤드폰을 착용하고 편안한 소파에서 파트별 리스닝 음원을 들으며 귀를 트이게 합니다."
      },
      {
        id: "home_desk_pomodoro",
        title: "내 방 책상 뽀모도로 몰입 스터디",
        category: "개인 스터디",
        icon: "🖥️",
        locations: ["home"],
        conditions: ["normal", "energetic"],
        goals: ["study"],
        intensity: "high",
        reason: "조용하고 익숙한 내 방에서 타이머를 켜고 딴짓 없이 단숨에 목표 챕터를 끝냅니다."
      },
      {
        id: "home_online_lecture",
        title: "녹화 온라인 강의 1.25배속 집중 수강",
        category: "인강 수강",
        icon: "💻",
        locations: ["home"],
        conditions: ["normal", "energetic"],
        goals: ["study"],
        intensity: "medium",
        reason: "밀렸던 온라인 강의를 배속 재생으로 빠르게 소화하고 퀴즈 과제까지 완료합니다."
      },
      {
        id: "home_tablet_light_study",
        title: "소파에서 태블릿 강의 슬라이드 훑어보기",
        category: "가벼운 복습",
        icon: "📱",
        locations: ["home"],
        conditions: ["tired", "normal"],
        goals: ["study"],
        intensity: "light",
        reason: "몸에 부담을 주지 않도록 편안한 자세로 핵심 요약 슬라이드를 가볍게 복습합니다."
      },
      {
        id: "transit_flashcards",
        title: "스마트폰 암기 앱 영단어·필수 공식 체크",
        category: "모바일 학습",
        icon: "📱",
        locations: ["transit"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["study"],
        intensity: "light",
        reason: "이동 중 흔들림 속에서도 스마트폰으로 단어나 핵심 요약본을 안전하고 손쉽게 넘겨봅니다."
      },
      {
        id: "transit_audio_lecture",
        title: "이어폰으로 교양 팟캐스트 & 강의 녹음 청취",
        category: "오디오 학습",
        icon: "🎧",
        locations: ["transit"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["study"],
        intensity: "light",
        reason: "눈의 피로를 덜어주면서 이어폰으로 강의 음원을 들어 이동 시간을 알차게 바꿉니다."
      },

      /* --- ASSIGNMENT (과제) --- */
      {
        id: "sch_pc_lab_report",
        title: "PC랩실 학술 DB 검색 & 리포트 초안 작성",
        category: "과제 리서치",
        icon: "💻",
        locations: ["school"],
        conditions: ["normal", "energetic"],
        goals: ["assignment"],
        intensity: "high",
        reason: "교내 학술 논문 DB 무료 열람과 빠른 PC 환경을 활용해 막막했던 리포트 뼈대를 세웁니다."
      },
      {
        id: "sch_team_project_ppt",
        title: "조별과제 발표 PPT 슬라이드 구성 & 디자인",
        category: "팀플/발표",
        icon: "📊",
        locations: ["school"],
        conditions: ["normal", "energetic"],
        goals: ["assignment"],
        intensity: "high",
        reason: "팀원들과 분담한 발표 자료를 일목요연한 템플릿에 맞추어 디자인합니다."
      },
      {
        id: "sch_report_check",
        title: "과제 제출 전 맞춤법·출처 표기 최종 점검",
        category: "과제 마무리",
        icon: "📄",
        locations: ["school"],
        conditions: ["tired", "normal"],
        goals: ["assignment"],
        intensity: "light",
        reason: "과제 마감 전 감점 요인이 되는 오탈자와 참고문헌 각주 양식을 꼼꼼하게 다듬습니다."
      },
      {
        id: "home_dual_report_writing",
        title: "듀얼 모니터로 과제 본문 속전속결 집필",
        category: "과제 집필",
        icon: "⌨️",
        locations: ["home"],
        conditions: ["normal", "energetic"],
        goals: ["assignment"],
        intensity: "high",
        reason: "넓은 화면에서 레퍼런스를 띄워두고 방해받지 않는 환경에서 빠르게 과제를 써 내려갑니다."
      },
      {
        id: "home_report_proofread",
        title: "과제 출력물 퇴고 및 피드백 수정 반영",
        category: "과제 완성",
        icon: "📑",
        locations: ["home"],
        conditions: ["tired", "normal"],
        goals: ["assignment"],
        intensity: "medium",
        reason: "작성된 글을 소리 내어 읽어보며 문맥이 어색한 문장을 매끄럽게 교정합니다."
      },
      {
        id: "transit_assignment_brainstorm",
        title: "메모 앱에 과제 아이디어 개요 & 브레인스토밍",
        category: "모바일 기획",
        icon: "💡",
        locations: ["transit"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["assignment"],
        intensity: "light",
        reason: "이동 중에 문득 떠오르는 창의적인 아이디어를 메모장에 구조화해 두어 작성 시간을 절약합니다."
      },
      {
        id: "transit_team_chat_sync",
        title: "팀플 단톡방 진행 현황 공유 및 역할 조율",
        category: "팀플 커뮤니케이션",
        icon: "💬",
        locations: ["transit"],
        conditions: ["tired", "normal"],
        goals: ["assignment"],
        intensity: "light",
        reason: "이동하는 자투리 시간에 팀원들의 진행 상황을 확인하고 다음 회의 안건을 정리합니다."
      },

      /* --- EXERCISE (운동) --- */
      {
        id: "sch_gym_weight",
        title: "교내 헬스장 / 체육관 웨이트 트레이닝",
        category: "근력 운동",
        icon: "🏋️‍♂️",
        locations: ["school"],
        conditions: ["energetic"],
        goals: ["exercise"],
        intensity: "high",
        reason: "컨디션이 가장 좋을 때 교내 체육시설을 이용해 3대 루틴을 알차게 수행합니다."
      },
      {
        id: "sch_campus_walk",
        title: "캠퍼스 둘레길 & 잔디밭 파워 워킹",
        category: "유산소 산책",
        icon: "👟",
        locations: ["school"],
        conditions: ["normal", "energetic"],
        goals: ["exercise"],
        intensity: "medium",
        reason: "맑은 공기를 마시며 캠퍼스를 걸어 굳어있던 하체를 풀고 뇌에 신선한 산소를 공급합니다."
      },
      {
        id: "sch_bench_light_stretch",
        title: "캠퍼스 그늘 벤치 전신 이완 스트레칭",
        category: "가벼운 릴랙스",
        icon: "🧘",
        locations: ["school"],
        conditions: ["tired", "normal"],
        goals: ["exercise", "rest"],
        intensity: "light",
        reason: "강의실 의자에 오래 앉아 경직된 목과 어깨를 시원하게 펴주며 피로를 해소합니다."
      },
      {
        id: "home_mat_workout",
        title: "요가매트 홈트레이닝 코어 루틴",
        category: "홈 트레이닝",
        icon: "🤸‍♂️",
        locations: ["home"],
        conditions: ["normal", "energetic"],
        goals: ["exercise"],
        intensity: "high",
        reason: "집에서 편한 복장으로 플랭크, 스쿼트 등 코어와 전신 근육을 활성화합니다."
      },
      {
        id: "home_foam_roller",
        title: "폼롤러 전신 근막 이완 & 거북목 스트레칭",
        category: "체형 교정",
        icon: "🧘‍♀️",
        locations: ["home"],
        conditions: ["tired", "normal"],
        goals: ["exercise", "rest"],
        intensity: "light",
        reason: "무리한 운동 대신 뭉친 척추와 승모근을 부드럽게 마사지해 즉각적인 개운함을 얻습니다."
      },
      {
        id: "transit_stair_climbing",
        title: "환승 통로 계단 오르기 (에스컬레이터 패스)",
        category: "생활 속 유산소",
        icon: "🚶",
        locations: ["transit"],
        conditions: ["normal", "energetic"],
        goals: ["exercise"],
        intensity: "light",
        reason: "이동 경로 자체를 계단 걷기 운동으로 전환하여 안전하게 하체 근력을 단련합니다."
      },
      {
        id: "transit_seated_stretching",
        title: "좌석 바른 자세 유지 & 발목·어깨 틈새 스트레칭",
        category: "틈새 바디케어",
        icon: "🙆‍♂️",
        locations: ["transit"],
        conditions: ["tired", "normal"],
        goals: ["exercise", "rest"],
        intensity: "light",
        reason: "좌석에 앉아 주변에 방해되지 않도록 발목을 돌리고 어깨를 뒤로 젖혀 붓기를 예방합니다."
      },

      /* --- MEAL (식사) --- */
      {
        id: "sch_cafeteria_meal",
        title: "학생식당 든든한 가성비 점심 식사",
        category: "교내 식사",
        icon: "🍛",
        locations: ["school"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["meal"],
        intensity: "medium",
        reason: "가성비 좋고 영양 균형 잡힌 학식으로 오후 강의를 버틸 든든한 에너지를 충전합니다."
      },
      {
        id: "sch_cafe_sandwich",
        title: "교내 카페 신선한 샌드위치 & 아메리카노",
        category: "간편 식사 & 커피",
        icon: "🥪",
        locations: ["school"],
        conditions: ["tired", "normal"],
        goals: ["meal", "rest"],
        intensity: "light",
        reason: "혼밥도 부담 없는 아늑한 카페에서 신선한 샌드위치와 카페인 충전을 함께 즐깁니다."
      },
      {
        id: "home_cooked_lunch",
        title: "따뜻한 집밥 차려먹기 & 과일 후식",
        category: "영양 만점 식사",
        icon: "🍳",
        locations: ["home"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["meal"],
        intensity: "medium",
        reason: "자취방이나 집에서 편안한 옷을 입고 여유롭게 건강한 식사를 챙겨 먹습니다."
      },
      {
        id: "home_quick_healthy_bowl",
        title: "샐러드 & 닭가슴살 간편 건강 식단",
        category: "클린 식단",
        icon: "🥗",
        locations: ["home"],
        conditions: ["tired", "normal"],
        goals: ["meal"],
        intensity: "light",
        reason: "조리와 정리가 간편한 식단으로 위장에 부담 없이 빠르게 에너지를 보충합니다."
      },
      {
        id: "transit_protein_snack",
        title: "편의점 단백질 음료 & 견과류 간편 보충",
        category: "에너지 간편식",
        icon: "🥤",
        locations: ["transit"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["meal"],
        intensity: "light",
        reason: "이동 중 냄새나지 않는 간편 음료와 스낵으로 출출함을 달래고 집중력을 유지합니다."
      },

      /* --- REST (휴식) --- */
      {
        id: "sch_powernap_lounge",
        title: "학생회관 수면실 / 빈 라운지 20분 파워냅",
        category: "급속 수면 충전",
        icon: "😴",
        locations: ["school"],
        conditions: ["tired"],
        goals: ["rest"],
        intensity: "light",
        reason: "20분 전후의 짧은 낮잠은 뇌 속 피로 물질을 청소하여 오후 집중력을 두 배로 높여줍니다."
      },
      {
        id: "sch_bench_mindfulness",
        title: "캠퍼스 잔디밭 그늘 벤치 바람 쐬며 멍때리기",
        category: "멘탈 디톡스",
        icon: "🌿",
        locations: ["school"],
        conditions: ["tired", "normal"],
        goals: ["rest"],
        intensity: "light",
        reason: "스마트폰을 잠시 내려놓고 자연 바람을 느끼며 복잡했던 머릿속을 차분하게 비웁니다."
      },
      {
        id: "home_bed_powernap",
        title: "침대 암막 커튼 치고 포근한 수면 충전",
        category: "완벽한 휴식",
        icon: "🛏️",
        locations: ["home"],
        conditions: ["tired", "normal"],
        goals: ["rest"],
        intensity: "light",
        reason: "가장 편안한 내 침대에서 온몸의 긴장을 완전히 내려놓고 깊은 재충전 시간을 갖습니다."
      },
      {
        id: "home_sofa_music",
        title: "푹신한 소파에서 좋아하는 앨범 전곡 감상",
        category: "음악 힐링",
        icon: "🎶",
        locations: ["home"],
        conditions: ["tired", "normal"],
        goals: ["rest"],
        intensity: "light",
        reason: "눈을 감고 좋아하는 음악에 몰입하며 수업 스트레스를 기분 좋게 날려버립니다."
      },
      {
        id: "transit_noise_canceling",
        title: "노이즈 캔슬링 힐링 플레이리스트 감상",
        category: "사운드 테라피",
        icon: "🎵",
        locations: ["transit"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["rest"],
        intensity: "light",
        reason: "대중교통 소음을 차단하고 차분한 어쿠스틱/로파이 음악으로 마음의 여유를 찾습니다."
      },
      {
        id: "transit_scenic_meditation",
        title: "창밖 풍경 바라보며 가벼운 눈 마사지 & 멍때리기",
        category: "안구 힐링",
        icon: "🪟",
        locations: ["transit"],
        conditions: ["tired", "normal"],
        goals: ["rest"],
        intensity: "light",
        reason: "모니터와 책에서 벗어나 먼 곳을 바라보며 지친 눈 근육을 부드럽게 이완시킵니다."
      },

      /* --- ERRAND (개인 용무) --- */
      {
        id: "sch_print_documents",
        title: "도서관/복사실 수업 자료 및 과제 출력",
        category: "출력/인쇄 용무",
        icon: "🖨️",
        locations: ["school"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["errand"],
        intensity: "medium",
        reason: "수업 직전 붐비는 프린트실 대신 공강 시간을 활용해 여유롭게 출력물을 준비합니다."
      },
      {
        id: "sch_library_return",
        title: "중앙도서관 책 대출·반납 및 참고문헌 탐색",
        category: "도서관 용무",
        icon: "📖",
        locations: ["school"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["errand"],
        intensity: "medium",
        reason: "연체되기 전 대출 도서를 반납하고 다음 주 과제에 필요한 도서를 미리 대여합니다."
      },
      {
        id: "home_room_cleaning",
        title: "빨래 돌리기 & 책상 주변 환기 및 분리수거",
        category: "생활 공간 정돈",
        icon: "🧹",
        locations: ["home"],
        conditions: ["normal", "energetic"],
        goals: ["errand"],
        intensity: "medium",
        reason: "어질러진 공간을 깨끗하게 정리하면 시각적 스트레스가 해소되고 집중력이 향상됩니다."
      },
      {
        id: "transit_mobile_banking",
        title: "모바일 금융 송금 & 가계부/영수증 정리",
        category: "모바일 용무",
        icon: "💳",
        locations: ["transit", "school", "home"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["errand"],
        intensity: "light",
        reason: "자투리 이동 시간 동안 계좌 이체, 영수증 처리, 월간 지출을 모바일로 정리합니다."
      },
      {
        id: "transit_calendar_organize",
        title: "스마트폰 캘린더 이번 주 과제·시험 마감 점검",
        category: "일정 관리",
        icon: "📅",
        locations: ["transit", "school", "home"],
        conditions: ["tired", "normal", "energetic"],
        goals: ["errand"],
        intensity: "light",
        reason: "놓치기 쉬운 과제 제출일과 스터디 약속을 캘린더에 동기화해 완벽한 주간 계획을 세웁니다."
      }
    ];

    /* Contextual Buffer Templates for Moving, Prep, Wrap-up */
    const bufferTemplates = {
      prep: {
        school: { title: "교내 스팟 이동 및 필기도구/노트북 세팅", icon: "🎒", category: "이동 & 준비" },
        home: { title: "책상 정리 및 쾌적한 학습/활동 환경 세팅", icon: "💻", category: "환경 세팅" },
        transit: { title: "안전한 좌석/손잡이 확보 및 소지품 정돈", icon: "🚌", category: "이동 준비" }
      },
      mid: {
        school: { title: "물 한 잔과 가벼운 목·어깨 기지개", icon: "☕", category: "리프레시" },
        home: { title: "간식 한 입과 창문 환기 리프레시", icon: "🍵", category: "리프레시" },
        transit: { title: "심호흡과 눈 피로 풀기 리프레시", icon: "🧘‍♂️", category: "리프레시" }
      },
      wrap: {
        school: { title: "자리 정돈 & 다음 수업 강의실 여유 있게 이동", icon: "🚶‍♂️", category: "마무리 & 이동" },
        home: { title: "소지품 가방 챙기기 & 다음 강의 출발 준비", icon: "🎒", category: "출발 준비" },
        transit: { title: "목적지 도착 전 하차 준비 및 소지품 확인", icon: "🔔", category: "하차 준비" }
      }
    };

    /* ==========================================================================
       5. ALGORITHM: SCHEDULE GENERATOR (Strict Mathematical Match)
       ========================================================================== */
    function generateScheduleData(isRegenerate = false) {
      const { startTime, duration, location, condition, goal, memo } = state;

      // Filter eligible activities based on strict location & intensity safety
      let eligible = activityDatabase.filter(act => {
        if (!act.locations.includes(location)) return false;
        // Safety: no high-intensity in transit
        if (location === "transit" && act.intensity === "high") return false;
        // Condition: no high-intensity when tired
        if (condition === "tired" && act.intensity === "high") return false;
        return true;
      });

      // Goal specific candidates
      let goalEligible = eligible.filter(act => act.goals.includes(goal));
      if (goalEligible.length === 0) goalEligible = eligible;

      // Refresh / Secondary candidates
      let refreshEligible = eligible.filter(act => act.goals.includes("rest") || act.goals.includes("meal"));
      if (refreshEligible.length === 0) refreshEligible = eligible;

      // On re-recommendation, prioritize candidates that were NOT used in last turn
      function shuffleAndPrioritize(arr) {
        let fresh = arr.filter(a => !state.lastUsedIds.has(a.id));
        if (fresh.length === 0) fresh = arr;
        return [...fresh].sort(() => Math.random() - 0.5);
      }

      goalEligible = shuffleAndPrioritize(goalEligible);
      refreshEligible = shuffleAndPrioritize(refreshEligible);

      const prepInfo = bufferTemplates.prep[location] || bufferTemplates.prep.school;
      const midInfo = bufferTemplates.mid[location] || bufferTemplates.mid.school;
      const wrapInfo = bufferTemplates.wrap[location] || bufferTemplates.wrap.school;

      let blocks = [];

      if (duration === 30) {
        const act = goalEligible[0] || eligible[0];
        blocks.push({
          activity: act,
          minutes: 30,
          customReason: generateReason(act, location, condition, goal, memo)
        });
      } else if (duration === 45) {
        const act = goalEligible[0] || eligible[0];
        blocks.push({
          activity: act,
          minutes: 35,
          customReason: generateReason(act, location, condition, goal, memo)
        });
        blocks.push({
          activity: { id: "buf_wrap", ...wrapInfo, reason: "다음 수업에 지각하지 않도록 여유 있게 호흡을 가다듬고 이동합니다." },
          minutes: 10,
          customReason: "다음 일정에 쫓기지 않도록 여유 있게 호흡을 가다듬고 정돈합니다."
        });
      } else if (duration === 60) {
        const act = goalEligible[0] || eligible[0];
        blocks.push({
          activity: { id: "buf_prep", ...prepInfo, reason: "최적의 환경을 세팅하며 기분 좋은 워밍업을 시작합니다." },
          minutes: 10,
          customReason: "집중을 위한 도구와 환경을 정돈하며 공강을 산뜻하게 시작합니다."
        });
        blocks.push({
          activity: act,
          minutes: 40,
          customReason: generateReason(act, location, condition, goal, memo)
        });
        blocks.push({
          activity: { id: "buf_wrap", ...wrapInfo, reason: "소지품을 점검하고 여유로운 마음으로 다음 일정으로 전환합니다." },
          minutes: 10,
          customReason: "소지품을 점검하고 편안한 마음으로 다음 강의실로 이동합니다."
        });
      } else if (duration <= 90) { // 75, 90 mins
        const act = goalEligible[0] || eligible[0];
        const mainMins = duration - 30; // 10 prep + 10 mid + 10 wrap = 30
        blocks.push({
          activity: { id: "buf_prep", ...prepInfo },
          minutes: 10,
          customReason: "필요한 물품을 세팅하고 오늘 공강의 핵심 목표를 리마인드합니다."
        });
        blocks.push({
          activity: act,
          minutes: mainMins,
          customReason: generateReason(act, location, condition, goal, memo)
        });
        blocks.push({
          activity: { id: "buf_mid", ...midInfo },
          minutes: 10,
          customReason: "연속 집중 후의 뇌 피로를 물 한 모금과 가벼운 기지개로 날려줍니다."
        });
        blocks.push({
          activity: { id: "buf_wrap", ...wrapInfo },
          minutes: 10,
          customReason: "공강 시간을 기분 좋게 마무리하고 다음 장소로 여유 있게 향합니다."
        });
      } else if (duration <= 135) { // 105, 120, 135 mins
        const act1 = goalEligible[0] || eligible[0];
        const act2 = goalEligible[1] || refreshEligible[0] || eligible[1] || act1;
        const act2Mins = duration - 85; // 15 prep + 45 act1 + 15 mid + 10 wrap = 85

        blocks.push({
          activity: { id: "buf_prep", ...prepInfo },
          minutes: 15,
          customReason: "자리를 정돈하고 2시간 안팎의 공강을 알차게 보낼 환경을 세팅합니다."
        });
        blocks.push({
          activity: act1,
          minutes: 45,
          customReason: generateReason(act1, location, condition, goal, memo)
        });
        blocks.push({
          activity: { id: "buf_mid", ...midInfo },
          minutes: 15,
          customReason: "집중력이 자연스럽게 떨어지는 45분 시점에 맞춘 황금 휴식 타임입니다."
        });
        blocks.push({
          activity: act2,
          minutes: act2Mins,
          customReason: generateReason(act2, location, condition, goal, memo, true)
        });
        blocks.push({
          activity: { id: "buf_wrap", ...wrapInfo },
          minutes: 10,
          customReason: "오늘 달성한 일정을 체크하고 다음 강의실로 여유롭게 이동합니다."
        });
      } else if (duration <= 180) { // 150, 165, 180 mins (approx 3 hours)
        const act1 = goalEligible[0] || eligible[0];
        const midActivity = refreshEligible[0] || { id: "buf_mid", ...midInfo };
        const act2 = goalEligible[1] || eligible[1] || act1;

        const prepMins = 15;
        const midBreakMins = 30;
        const wrapMins = 15;
        const remaining = duration - (prepMins + midBreakMins + wrapMins); // duration - 60
        const part1 = Math.round(remaining * 0.55 / 15) * 15;
        const part2 = remaining - part1;

        blocks.push({
          activity: { id: "buf_prep", ...prepInfo },
          minutes: prepMins,
          customReason: "3시간의 넉넉한 공강 시간을 주도적으로 보내기 위한 준비 시간입니다."
        });
        blocks.push({
          activity: act1,
          minutes: part1,
          customReason: generateReason(act1, location, condition, goal, memo)
        });
        blocks.push({
          activity: midActivity,
          minutes: midBreakMins,
          customReason: "장시간 공강에서 꼭 필요한 중간 에너지 충전 및 편안한 리프레시입니다."
        });
        blocks.push({
          activity: act2,
          minutes: part2,
          customReason: generateReason(act2, location, condition, goal, memo, true)
        });
        blocks.push({
          activity: { id: "buf_wrap", ...wrapInfo },
          minutes: wrapMins,
          customReason: "오늘 하루의 성취를 정리하고 다음 수업을 차분히 맞이합니다."
        });
      } else { // 195, 210, 225, 240 mins (approx 4 hours)
        const act1 = goalEligible[0] || eligible[0];
        const mealOrRest = refreshEligible.find(a => a.goals.includes("meal")) || refreshEligible[0] || { id: "buf_mid", ...midInfo };
        const act2 = goalEligible[1] || eligible[1] || act1;
        const chillAct = refreshEligible.find(a => a.goals.includes("rest") && a.id !== mealOrRest.id) || { id: "buf_mid", ...midInfo };

        const prepMins = 10;
        const mealMins = 45;
        const chillMins = 20;
        const wrapMins = 15;
        const remaining = duration - (prepMins + mealMins + chillMins + wrapMins);
        const part1 = Math.round(remaining * 0.55 / 15) * 15;
        const part2 = remaining - part1;

        blocks.push({
          activity: { id: "buf_prep", ...prepInfo },
          minutes: prepMins,
          customReason: "4시간 대공강을 후회 없이 보내기 위한 환경 세팅과 체크리스트 점검입니다."
        });
        blocks.push({
          activity: act1,
          minutes: part1,
          customReason: generateReason(act1, location, condition, goal, memo)
        });
        blocks.push({
          activity: mealOrRest,
          minutes: mealMins,
          customReason: "긴 공강 시간 동안 지치지 않도록 든든하게 식사와 소화를 챙기는 시간입니다."
        });
        blocks.push({
          activity: act2,
          minutes: part2,
          customReason: generateReason(act2, location, condition, goal, memo, true)
        });
        blocks.push({
          activity: chillAct,
          minutes: chillMins,
          customReason: "오후 강의 직전 머리를 식히고 편안한 호흡으로 릴랙스하는 시간입니다."
        });
        blocks.push({
          activity: { id: "buf_wrap", ...wrapInfo },
          minutes: wrapMins,
          customReason: "소지품을 챙기고 여유로운 걸음으로 다음 강의실로 이동합니다."
        });
      }

      // Mathematical Safety Check: ensure sum of minutes EXACTLY equals duration
      const totalCalculated = blocks.reduce((sum, b) => sum + b.minutes, 0);
      if (totalCalculated !== duration && blocks.length > 0) {
        const diff = duration - totalCalculated;
        blocks[blocks.length - 1].minutes += diff;
      }

      // Save IDs for variety tracking
      state.lastUsedIds.clear();
      blocks.forEach(b => {
        if (b.activity && b.activity.id) state.lastUsedIds.add(b.activity.id);
      });

      // Compute Timestamps
      let currentMinutes = timeStringToMinutes(startTime);
      const scheduleItems = blocks.map((b, index) => {
        const startStr = minutesToTimeString(currentMinutes);
        const startKorean = minutesToKoreanTime(currentMinutes);
        const endMinutes = currentMinutes + b.minutes;
        const endStr = minutesToTimeString(endMinutes);
        const endKorean = minutesToKoreanTime(endMinutes);
        currentMinutes = endMinutes;

        let title = b.activity.title;
        if (memo && index === 1 && !b.activity.id.startsWith("buf_")) {
          title = `${b.activity.title} (${memo})`;
        }

        return {
          id: `item-${Date.now()}-${index}`,
          startTime: startStr,
          endTime: endStr,
          startKorean: startKorean,
          endKorean: endKorean,
          duration: b.minutes,
          title: title,
          category: b.activity.category || "일정",
          icon: b.activity.icon || "📌",
          reason: b.customReason || b.activity.reason || "알찬 공강 시간 관리를 위해 배치되었습니다.",
          isCompleted: false
        };
      });

      return scheduleItems;
    }

    function generateReason(activity, location, condition, goal, memo, isSecondary = false) {
      const locText = locationLabels[location]?.label;
      const condText = conditionLabels[condition]?.label;
      const goalText = goalLabels[goal]?.label;

      if (memo && !isSecondary) {
        return `입력해주신 <strong>'${memo}'</strong> 목표를 집중적으로 끝낼 수 있도록, 현재 [${locText}] 환경과 [${condText}] 컨디션에 딱 맞춰 배치했습니다.`;
      }
      if (location === "transit") {
        return `이동 중 안전을 최우선으로 고려하여, 대중교통 안에서도 흔들림 없이 편안하게 실행할 수 있는 맞춤 루틴입니다.`;
      }
      if (condition === "tired") {
        return `현재 몸이 다소 피곤한 상태이므로 뇌에 과도한 스트레스를 주지 않고 부담 없이 성취감을 챙길 수 있도록 강도를 조절했습니다.`;
      }
      if (condition === "energetic") {
        return `에너지가 충만한 날이므로, 높은 집중력이 요구되는 <strong>[${goalText}]</strong> 핵심 분량을 단숨에 격파할 수 있도록 설계했습니다.`;
      }
      return `${locText}에서 ${goalText} 목표를 가장 효율적으로 달성할 수 있도록 이동 동선과 피로도를 함께 고려해 추천했습니다.`;
    }

    /* Helper: Time arithmetic */
    function timeStringToMinutes(str) {
      if (!str) return 780; // default 13:00
      const [h, m] = str.split(":").map(Number);
      return h * 60 + m;
    }

    function minutesToTimeString(mins) {
      let h = Math.floor(mins / 60) % 24;
      let m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    function minutesToKoreanTime(mins) {
      let totalH = Math.floor(mins / 60) % 24;
      let m = mins % 60;
      const ampm = totalH < 12 ? "오전" : (totalH === 12 ? "낮" : "오후");
      const displayH = totalH % 12 === 0 ? 12 : totalH % 12;
      const displayM = m === 0 ? "00" : String(m).padStart(2, "0");
      return `${ampm} ${displayH}:${displayM}`;
    }

    /* ==========================================================================
       6. WIDE SPEECH POOL FOR ASSISTANT RECOMMENDATIONS
       ========================================================================== */
    function generateAssistantSpeech() {
      const { duration, location, condition, goal, memo } = state;
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      let timeText = hours > 0 ? (mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`) : `${mins}분`;

      const locName = locationLabels[location]?.label;
      const condName = conditionLabels[condition]?.label;
      const goalName = goalLabels[goal]?.label;

      const energeticSpeeches = [
        `오! 오늘 공강이 <strong>${timeText}</strong>이나 있네요! 😎 ${locName}에 계시고 컨디션도 <strong>[${condName}]</strong>이라 집중력 최고조의 날입니다. ${memo ? `미뤄뒀던 <strong>'${memo}'</strong>부터 시원하게 끝내보는 건 어떨까요? ` : `오늘은 목표하신 <strong>[${goalName}]</strong>을 완벽하게 끝내보는 건 어떨까요? `}중간에 커피 한 잔의 여유도 꼭 챙겨봐요! ☕`,
        `열정 충전 완료! 🔥 <strong>${timeText}</strong> 동안 ${locName}에서 최고의 성취감을 맛볼 수 있는 시간표를 완성했어요. 이 기세라면 다음 수업도 아주 가뿐하게 들을 수 있겠네요! 🚀`,
        `반가워요! 활기가 넘치는 공강 <strong>${timeText}</strong>은 대학 생활의 큰 기회죠! ✨ ${memo ? `입력해주신 <strong>'${memo}'</strong> 분량을 단숨에 격파할 수 있도록 ` : `선택하신 <strong>[${goalName}]</strong>에 몰입할 수 있도록 `}황금 루틴을 짜드렸으니 파이팅 넘치게 달려봐요! 🏃‍♂️`
      ];

      const tiredSpeeches = [
        `오늘 많이 피곤하셨죠? 🥱 공강 <strong>${timeText}</strong> 동안 무리하지 않고 컨디션을 회복하면서도, <strong>[${goalName}]</strong> 목표를 가볍게 챙길 수 있는 힐링 시간표를 준비했어요. 무리 말고 차근차근 해봐요! ☕`,
        `수업 듣느라 고생 많으셨어요! 🌿 <strong>${timeText}</strong> 동안 지친 뇌를 달래줄 충전 시간을 넉넉히 배치했습니다. 억지로 달리지 않아도 충분히 알찬 공강을 만들 수 있어요. 파이팅! 푹 쉬어가요 🛋️`,
        `에너지 게이지가 낮을 땐 스마트한 완급 조절이 답이죠! 🔋 ${locName}에서 부담 없이 소화할 수 있는 편안한 템포로 <strong>${timeText}</strong>을 꽉 채워드렸습니다. 한 걸음씩 가볍게 따라와 보세요! 🌈`
      ];

      const normalSpeeches = [
        `안녕하세요! 오늘 <strong>${timeText}</strong>의 공강 시간표가 완성되었습니다. 😊 ${locName}에 계시고 컨디션도 안정적이니, <strong>[${goalName}]</strong>를 깔끔하게 해치우기에 딱 좋은 타이밍이에요! 중간 휴식까지 야무지게 챙겼답니다. 🎯`,
        `공강 <strong>${timeText}</strong>을 그냥 흘려보내지 않도록 개인 비서가 꼼꼼하게 설계했어요! ⏰ ${memo ? `입력해주신 <strong>'${memo}'</strong>에 집중할 시간도 듬뿍 반영했으니 ` : ''}순서대로 체크하며 뿌듯한 성취감을 느껴보세요! 👏`,
        `딱 기분 좋은 공강 <strong>${timeText}</strong>이네요! 🍀 생산성과 리프레시의 균형을 맞춘 알짜배기 일정표입니다. 커피 한 잔과 함께 차분하게 시작해 볼까요? ☕`
      ];

      let pool = normalSpeeches;
      if (condition === "energetic") pool = energeticSpeeches;
      if (condition === "tired") pool = tiredSpeeches;

      return pool[Math.floor(Math.random() * pool.length)];
    }

    /* ==========================================================================
       7. RENDER FUNCTIONS
       ========================================================================== */
    function generateSchedule() {
      if (!state.startTime) {
        showValidationAlert("공강 시작 시간을 선택해 주세요.");
        return;
      }
      if (!state.duration || state.duration < 30) {
        showValidationAlert("공강 지속 시간을 30분 이상 선택해 주세요.");
        return;
      }

      state.memo = customMemoInput.value.trim();
      state.completedItems.clear();
      state.scheduleItems = generateScheduleData(false);

      renderResultScreen();
      goToScreen("result");
    }

    function regenerateSchedule() {
      state.completedItems.clear();
      state.scheduleItems = generateScheduleData(true);
      renderResultScreen();
      window.scrollTo(0, 0);
      showToast("새로운 맞춤 일정으로 재추천되었습니다! 🔄");
    }

    function renderResultScreen() {
      const speechBox = document.getElementById("assistantSpeech");
      speechBox.innerHTML = generateAssistantSpeech();

      const summaryContainer = document.getElementById("summaryTags");
      summaryContainer.innerHTML = "";

      const durationHours = Math.floor(state.duration / 60);
      const durationMins = state.duration % 60;
      const durationStr = durationHours > 0 ? (durationMins > 0 ? `${durationHours}시간 ${durationMins}분` : `${durationHours}시간`) : `${durationMins}분`;

      const tags = [
        { icon: "⏰", text: `시작 ${minutesToKoreanTime(timeStringToMinutes(state.startTime))}` },
        { icon: "⏳", text: `공강 ${durationStr} (${state.duration}분)`, highlight: true },
        { icon: locationLabels[state.location].icon, text: locationLabels[state.location].label },
        { icon: conditionLabels[state.condition].icon, text: conditionLabels[state.condition].label },
        { icon: goalLabels[state.goal].icon, text: `목표: ${goalLabels[state.goal].label}`, highlight: true }
      ];

      if (state.memo) {
        tags.push({ icon: "✏️", text: `메모: ${state.memo}` });
      }

      tags.forEach(t => {
        const span = document.createElement("span");
        span.className = `summary-tag ${t.highlight ? 'highlight' : ''}`;
        span.innerHTML = `<span>${t.icon}</span> <span>${t.text}</span>`;
        summaryContainer.appendChild(span);
      });

      const timelineContainer = document.getElementById("timelineContainer");
      timelineContainer.innerHTML = "";

      document.getElementById("timelineTotalDuration").textContent = `총 ${durationStr} (${state.duration}분)`;

      state.scheduleItems.forEach((item) => {
        const isCompleted = state.completedItems.has(item.id);

        const itemEl = document.createElement("div");
        itemEl.className = `timeline-item ${isCompleted ? 'completed' : ''}`;
        itemEl.id = `timeline-el-${item.id}`;

        itemEl.innerHTML = `
          <div class="timeline-node"></div>
          <div class="timeline-card">
            <div class="card-top">
              <div class="time-slot">
                <span>🕒</span>
                <span>${item.startKorean} ~ ${item.endKorean}</span>
              </div>
              <span class="duration-pill">${item.duration}분</span>
            </div>

            <div class="activity-main">
              <div class="activity-icon-badge">${item.icon}</div>
              <div class="activity-details">
                <div class="activity-title">${item.title}</div>
                <div class="activity-category">${item.category}</div>
              </div>
            </div>

            <div class="reason-box">
              <strong>추천 이유:</strong> ${item.reason}
            </div>

            <div class="card-actions">
              <button type="button" class="btn-check" onclick="toggleItemComplete('${item.id}')">
                <span class="check-icon">${isCompleted ? '✓ 완료됨' : '○ 완료 체크'}</span>
              </button>
            </div>
          </div>
        `;

        timelineContainer.appendChild(itemEl);
      });

      updateProgress();
    }

    /* ==========================================================================
       8. COMPLETION & PROGRESS TRACKER
       ========================================================================== */
    function toggleItemComplete(itemId) {
      if (state.completedItems.has(itemId)) {
        state.completedItems.delete(itemId);
      } else {
        state.completedItems.add(itemId);
      }

      const itemEl = document.getElementById(`timeline-el-${itemId}`);
      const isCompleted = state.completedItems.has(itemId);
      if (itemEl) {
        itemEl.classList.toggle("completed", isCompleted);
        const checkBtn = itemEl.querySelector(".btn-check");
        if (checkBtn) {
          checkBtn.innerHTML = `<span>${isCompleted ? '✓ 완료됨' : '○ 완료 체크'}</span>`;
        }
      }

      updateProgress();
    }

    function updateProgress() {
      const total = state.scheduleItems.length;
      const completed = state.completedItems.size;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      const percentEl = document.getElementById("progressPercent");
      const fillEl = document.getElementById("progressBarFill");
      const textEl = document.getElementById("progressStatusText");
      const congratsEl = document.getElementById("congratsBanner");

      percentEl.textContent = `${percent}%`;
      fillEl.style.width = `${percent}%`;

      if (percent === 100) {
        textEl.textContent = `축하합니다! 모든 일정을 완벽하게 수행했습니다! (${completed}/${total}개 완료)`;
        congratsEl.style.display = "block";
        triggerConfetti();
      } else if (percent > 0) {
        textEl.textContent = `공강을 알차게 보내는 중이에요! (${completed}/${total}개 완료)`;
        congratsEl.style.display = "none";
      } else {
        textEl.textContent = `완료한 일정을 체크해 보세요! (0/${total}개 완료)`;
        congratsEl.style.display = "none";
      }
    }

    /* ==========================================================================
       9. COPY SCHEDULE TO CLIPBOARD
       ========================================================================== */
    function copyScheduleToClipboard() {
      const durationHours = Math.floor(state.duration / 60);
      const durationMins = state.duration % 60;
      const durationStr = durationHours > 0 ? (durationMins > 0 ? `${durationHours}시간 ${durationMins}분` : `${durationHours}시간`) : `${durationMins}분`;

      let text = `[GAP TIME - 나의 공강 시간표]\n`;
      text += `📍 위치: ${locationLabels[state.location].label} | 🔋 컨디션: ${conditionLabels[state.condition].label} | 🎯 목표: ${goalLabels[state.goal].label}\n`;
      text += `⏳ 총 공강: ${durationStr} (${state.duration}분)\n`;
      if (state.memo) text += `✏️ 메모: ${state.memo}\n`;
      text += `------------------------------------\n`;

      state.scheduleItems.forEach((item) => {
        const check = state.completedItems.has(item.id) ? "✅" : "⬜";
        text += `${check} ${item.startKorean} ~ ${item.endKorean} (${item.duration}분)\n`;
        text += `   ${item.icon} ${item.title}\n`;
      });
      text += `------------------------------------\n공강시간 활용 플래너 GAP TIME에서 생성됨 ⏰`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("시간표가 클립보드에 복사되었습니다! 📋");
        }).catch(() => {
          fallbackCopyText(text);
        });
      } else {
        fallbackCopyText(text);
      }
    }

    function fallbackCopyText(text) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        showToast("시간표가 클립보드에 복사되었습니다! 📋");
      } catch (err) {
        showToast("복사 실패. 브라우저 설정을 확인해 주세요.");
      }
      document.body.removeChild(textarea);
    }

    function showToast(msg) {
      const toast = document.getElementById("toastPopup");
      const toastText = document.getElementById("toastText");
      toastText.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 2500);
    }

    /* ==========================================================================
       10. CONFETTI CELEBRATION EFFECT
       ========================================================================== */
    function triggerConfetti() {
      const canvas = document.getElementById("confetti-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ["#38bdf8", "#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#a7f3d0"];

      for (let i = 0; i < 70; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.4,
          r: Math.random() * 6 + 4,
          dx: (Math.random() - 0.5) * 14,
          dy: (Math.random() - 0.9) * 16,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
          opacity: 1
        });
      }

      let animId;
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        particles.forEach(p => {
          p.x += p.dx;
          p.y += p.dy;
          p.dy += 0.45;
          p.dx *= 0.98;
          p.rotation += p.rotSpeed;
          p.opacity -= 0.012;

          if (p.opacity > 0) {
            alive = true;
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 1.4);
            ctx.restore();
          }
        });

        if (alive) {
          animId = requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          cancelAnimationFrame(animId);
        }
      }
      animate();
    }

    window.addEventListener("resize", () => {
      const canvas = document.getElementById("confetti-canvas");
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });

    document.addEventListener("DOMContentLoaded", () => {
      updateDurationUI(state.duration);
      updateTimeKoreanDisplay(state.startTime);
      updateQuickTimeActiveState();
    });
