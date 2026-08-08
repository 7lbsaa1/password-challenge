import { db, ref, update } from './firebase.js';
import { auth } from './auth.js';
import { PlayerManager } from './playerManager.js';
import { RoomManager } from './room.js';

export class GameManager {
  constructor() {
    this.roomMgr = new RoomManager();
    this.timerInterval = null;
  }

  init() {
    this.roomMgr.listenToRoom((roomData) => {
      if (!roomData) {
        alert("الغرفة غير موجودة أو انتهت صلاحيتها!");
        window.location.href = "/gamepassword";
        return;
      }
      this.renderRoomUI(roomData);
      this.handleGamePhases(roomData);
    });
  }

  async startGame() {
    if (this.roomMgr.roomData.ownerId !== auth.userId) return;
    
    const { red, blue } = this.roomMgr.roomData;
    if (!red.operative || !red.spymaster || !blue.operative || !blue.spymaster) {
      alert("يجب اكتمال 4 لاعبين في جميع الأدوار لبدء التحدي!");
      return;
    }

    const firstPlayer = await PlayerManager.getRoundPlayer();
    const roundEndsAt = Date.now() + (this.roomMgr.roomData.roundTime * 1000);

    await update(ref(db, `rooms/${this.roomMgr.roomId}`), {
      status: 'playing',
      phase: 'intro', // يبدأ بشاشة القوانين shroot.png
      currentRound: 1,
      currentTeam: 'red',
      currentPlayer: firstPlayer,
      currentClue: '',
      currentAnswer: '',
      roundEndsAt: Date.now() + 6000 // 6 ثوانٍ لعرض القوانين
    });
  }

  // مزامنة المؤقت بين اللاعبين بناءً على توقيت السيرفر
  handleGamePhases(room) {
    clearInterval(this.timerInterval);
    if (room.status !== 'playing') return;

    this.timerInterval = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.ceil((room.roundEndsAt - Date.now()) / 1000));
      const timerEl = document.getElementById("game-timer");
      if (timerEl) timerEl.innerText = remainingSeconds;

      // عندما ينتهي المؤقت ويتم إدارة التبديل عبر صاحب الغرفة لتفادي التداخل
      if (remainingSeconds <= 0 && room.ownerId === auth.userId) {
        this.onTimerExpired(room);
      }
    }, 1000);
  }

  async onTimerExpired(room) {
    if (room.phase === 'intro') {
      await update(ref(db, `rooms/${this.roomMgr.roomId}`), {
        phase: 'hint',
        roundEndsAt: Date.now() + (room.roundTime * 1000)
      });
    } else if (room.phase === 'hint' || room.phase === 'answer') {
      // عند نفاد الوقت ينتقل الدور للفريق الخصم مع بقاء نفس اللاعب
      const nextTeam = room.currentTeam === 'red' ? 'blue' : 'red';
      await update(ref(db, `rooms/${this.roomMgr.roomId}`), {
        currentTeam: nextTeam,
        phase: 'hint',
        currentClue: '',
        currentAnswer: '',
        roundEndsAt: Date.now() + (room.roundTime * 1000)
      });
    }
  }

  async submitClue(clueText) {
    const room = this.roomMgr.roomData;
    if (!clueText.trim()) return;
    
    await update(ref(db, `rooms/${this.roomMgr.roomId}`), {
      currentClue: clueText.trim(),
      phase: 'answer',
      roundEndsAt: Date.now() + (room.roundTime * 1000)
    });
  }

  async submitAnswer(answerText) {
    const room = this.roomMgr.roomData;
    if (!answerText.trim()) return;

    await update(ref(db, `rooms/${this.roomMgr.roomId}`), {
      currentAnswer: answerText.trim(),
      phase: 'verify'
    });
  }

  async verifyAnswer(isCorrect) {
    const room = this.roomMgr.roomData;
    
    if (isCorrect) {
      const newScore = (room.scores[room.currentTeam] || 0) + 1;
      const updates = {
        [`scores/${room.currentTeam}`]: newScore
      };

      if (room.currentRound >= room.rounds) {
        updates.status = 'finished';
        updates.phase = 'finished';
      } else {
        const nextPlayer = await PlayerManager.getRoundPlayer();
        updates.currentRound = room.currentRound + 1;
        updates.currentPlayer = nextPlayer;
        updates.phase = 'hint';
        updates.currentClue = '';
        updates.currentAnswer = '';
        updates.roundEndsAt = Date.now() + (room.roundTime * 1000);
      }
      await update(ref(db, `rooms/${this.roomMgr.roomId}`), updates);
    } else {
      // إجابة خاطئة: لا نقطة، نفس اللاعب، وينتقل الدور للفريق الخصم
      const nextTeam = room.currentTeam === 'red' ? 'blue' : 'red';
      await update(ref(db, `rooms/${this.roomMgr.roomId}`), {
        currentTeam: nextTeam,
        phase: 'hint',
        currentClue: '',
        currentAnswer: '',
        roundEndsAt: Date.now() + (room.roundTime * 1000)
      });
    }
  }

  renderRoomUI(room) {
    // تحديث أسماء اللاعبين في الفريقين
    this.updateSeatUI("red-op-seat", room.red?.operative, 'red', 'operative');
    this.updateSeatUI("red-spy-seat", room.red?.spymaster, 'red', 'spymaster');
    this.updateSeatUI("blue-op-seat", room.blue?.operative, 'blue', 'operative');
    this.updateSeatUI("blue-spy-seat", room.blue?.spymaster, 'blue', 'spymaster');

    // تحديث النقاط والجولات
    document.getElementById("red-score").innerText = room.scores?.red || 0;
    document.getElementById("blue-score").innerText = room.scores?.blue || 0;
    document.getElementById("current-round-text").innerText = `${room.currentRound} / ${room.rounds}`;
    document.getElementById("active-team-banner").innerText = room.currentTeam === 'red' ? 'RED TEAM TURN' : 'BLUE TEAM TURN';

    // التحكم في ظهور لوحة الإعدادات لصاحب الغرفة قبل البدء
    const settingsPanel = document.getElementById("room-settings-panel");
    if (settingsPanel) {
      settingsPanel.style.display = (room.ownerId === auth.userId && room.status === 'waiting') ? 'flex' : 'none';
    }

    // إدارة نوافذ القوانين ونهاية اللعبة
    const rulesModal = document.getElementById("rules-modal");
    if (rulesModal) rulesModal.classList.toggle("active", room.phase === 'intro');

    const finishModal = document.getElementById("finish-modal");
    if (finishModal) {
      finishModal.classList.toggle("active", room.phase === 'finished');
      if (room.phase === 'finished') {
        const winner = room.scores.red > room.scores.blue ? 'RED TEAM للفريق الفائز' : room.scores.blue > room.scores.red ? 'BLUE TEAM للفريق الفائز' : 'تعادل الفريقين!';
        document.getElementById("winner-text").innerText = winner;
      }
    }

    // منطق إخفاء اللاعب (تظهر الصورة فقط للـ OPERATIVE في الفريق صاحب الدور)
    const playerImgEl = document.getElementById("player-image");
    const mysteryOverlay = document.getElementById("mystery-overlay");
    const isCurrentTeamOperative = room[room.currentTeam]?.operative?.id === auth.userId;

    if (playerImgEl && mysteryOverlay && room.currentPlayer) {
      if (isCurrentTeamOperative && room.status === 'playing' && room.phase !== 'intro') {
        playerImgEl.src = room.currentPlayer.image;
        playerImgEl.style.display = 'block';
        mysteryOverlay.style.display = 'none';
      } else {
        playerImgEl.style.display = 'none';
        mysteryOverlay.style.display = 'flex';
      }
    }

    // التحكم في إدخالات التلميح والإجابة والتحقق حسب الصلاحية والأدوار
    const clueBox = document.getElementById("clue-input-area");
    const answerBox = document.getElementById("answer-input-area");
    const verifyBox = document.getElementById("verify-area");

    if (clueBox) clueBox.style.display = (isCurrentTeamOperative && room.phase === 'hint') ? 'flex' : 'none';
    if (answerBox) answerBox.style.display = (room[room.currentTeam]?.spymaster?.id === auth.userId && room.phase === 'answer') ? 'flex' : 'none';
    if (verifyBox) verifyBox.style.display = (isCurrentTeamOperative && room.phase === 'verify') ? 'flex' : 'none';

    // عرض التلميح والإجابة للجميع في الحلبة
    document.getElementById("display-clue-text").innerText = room.currentClue || 'بانتظار التلميح...';
    document.getElementById("display-answer-text").innerText = room.currentAnswer || '';
  }

  updateSeatUI(elementId, occupant, team, role) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (occupant) {
      el.innerHTML = `<span>${occupant.name}</span> <button class="btn-report" onclick="openReportModal('${occupant.id}', '${occupant.name}')">إبلاغ</button>`;
      el.classList.add('occupied');
    } else {
      const btnText = role === 'operative' ? 'JOIN TEAM' : 'JOIN';
      el.innerHTML = `<button class="btn btn-outline" onclick="joinTeamAction('${team}', '${role}')">${btnText}</button>`;
      el.classList.remove('occupied');
    }
  }
}
