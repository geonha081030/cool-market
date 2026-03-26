// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUql6jS2F-6tF_8edoNVjDwL1x61KyNKw",
  authDomain: "school-market-5145f.firebaseapp.com",
  projectId: "school-market-5145f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// roomId 가져오기
const params = new URLSearchParams(window.location.search);
const roomId = params.get("roomId");

// 로그인 확인
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("로그인 필요");
    window.location.href = "index.html";
    return;
  }

  loadMessages();
});

// 메시지 실시간 로딩
function loadMessages() {
  const q = query(
    collection(db, `chatRooms/${roomId}/messages`),
    orderBy("createdAt")
  );

  onSnapshot(q, (snapshot) => {
    const div = document.getElementById("chat");
    div.innerHTML = "";

    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      const isMe = m.senderId === auth.currentUser.uid;

      div.innerHTML += `<div><b>${isMe ? "나" : "상대"}</b>: ${m.text}</div>`;
    });

    div.scrollTop = div.scrollHeight;
  });
}

// 메시지 보내기
window.sendChatMessage = async () => {
  const input = document.getElementById("messageInput");
  const text = input.value;

  if (!text) return;

  await addDoc(collection(db, `chatRooms/${roomId}/messages`), {
    senderId: auth.currentUser.uid,
    text,
    createdAt: serverTimestamp()
  });

  input.value = "";
};
