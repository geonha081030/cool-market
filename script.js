// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// -------------------- 초기화 --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAUql6jS2F-6tF_8edoNVjDwL1x61KyNKw",
  authDomain: "school-market-5145f.firebaseapp.com",
  projectId: "school-market-5145f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentRoomId = null;

// -------------------- 로그인 상태 --------------------
onAuthStateChanged(auth, (user) => {
  console.log("로그인 상태:", user);
});

// -------------------- 🔥 채팅 시작 (디버그 포함) --------------------
window.startChat = async (itemId, sellerId) => {
  console.log("채팅 버튼 클릭됨", itemId, sellerId);

  alert("버튼 눌림 확인"); // 👉 이거 안 뜨면 버튼 문제

  try {
    const room = await addDoc(collection(db, "chatRooms"), {
      itemId,
      sellerId,
      buyerId: auth.currentUser?.uid || "test",
      createdAt: new Date()
    });

    currentRoomId = room.id;

    alert("채팅방 생성됨: " + currentRoomId);

    loadMessages(currentRoomId);

  } catch (e) {
    console.error("에러 발생:", e);
    alert("에러: " + e.message);
  }
};

// -------------------- 메시지 로딩 --------------------
function loadMessages(roomId) {
  onSnapshot(collection(db, `chatRooms/${roomId}/messages`), (snap) => {
    const div = document.getElementById("chat");
    div.innerHTML = "";

    snap.forEach(doc => {
      const d = doc.data();
      div.innerHTML += `<div>${d.text}</div>`;
    });
  });
}

// -------------------- 메시지 보내기 --------------------
window.sendChatMessage = async () => {
  const text = document.getElementById("messageInput").value;

  if (!currentRoomId) {
    alert("채팅 먼저 시작");
    return;
  }

  await addDoc(collection(db, `chatRooms/${currentRoomId}/messages`), {
    text
  });
};
