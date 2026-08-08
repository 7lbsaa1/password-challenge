import { db, ref, set, get, update, onValue } from './firebase.js';
import { auth } from './auth.js';

export class RoomManager {
  constructor() {
    this.roomId = new URLSearchParams(window.location.search).get('room');
    this.roomData = null;
    this.onRoomUpdateCallback = null;
  }

  async createRoom(roomName = "غرفة التحدي", rounds = 10, roundTime = 30) {
    const newRoomId = 'room_' + Math.random().toString(36).substring(2, 9);
    const newRoomRef = ref(db, `rooms/${newRoomId}`);
    
    const initialData = {
      id: newRoomId,
      name: roomName,
      ownerId: auth.userId,
      ownerName: auth.userName,
      status: 'waiting', // waiting, playing, finished
      rounds: Number(rounds),
      roundTime: Number(roundTime),
      currentRound: 1,
      currentTeam: 'red',
      phase: 'intro', // intro, hint, answer, verify, finished
      currentClue: '',
      currentAnswer: '',
      roundEndsAt: 0,
      currentPlayer: null,
      red: { operative: null, spymaster: null },
      blue: { operative: null, spymaster: null },
      scores: { red: 0, blue: 0 }
    };

    await set(newRoomRef, initialData);
    window.location.href = `/gamepassword?room=${newRoomId}`;
  }

  listenToRoom(callback) {
    if (!this.roomId) return;
    this.onRoomUpdateCallback = callback;
    const roomRef = ref(db, `rooms/${this.roomId}`);
    
    onValue(roomRef, (snapshot) => {
      this.roomData = snapshot.val();
      if (this.onRoomUpdateCallback) {
        this.onRoomUpdateCallback(this.roomData);
      }
    });
  }

  async joinTeamRole(team, role) {
    if (!this.roomData) return;
    
    // منع احتلال المقعد إذا كان ممتلئاً ومحجوزاً للاعب آخر
    const currentOccupant = this.roomData[team]?.[role];
    if (currentOccupant && currentOccupant.id !== auth.userId) {
      alert("هذا المكان ممتلئ! الرجاء اختيار مكان آخر.");
      return;
    }

    // إزالة اللاعب من أي مقعد آخر في الغرفة قبل إضافته للمقعد الجديد
    const updates = {};
    ['red', 'blue'].forEach(t => {
      ['operative', 'spymaster'].forEach(r => {
        if (this.roomData[t]?.[r]?.id === auth.userId) {
          updates[`${t}/${r}`] = null;
        }
      });
    });

    updates[`${team}/${role}`] = {
      id: auth.userId,
      name: auth.userName
    };

    await update(ref(db, `rooms/${this.roomId}`), updates);
  }

  async updateSettings(rounds, roundTime) {
    if (!this.roomData || this.roomData.ownerId !== auth.userId) return;
    await update(ref(db, `rooms/${this.roomId}`), {
      rounds: Number(rounds),
      roundTime: Number(roundTime)
    });
  }

  getInviteLink() {
    return `${window.location.origin}/gamepassword?room=${this.roomId}`;
  }
}
