// -------------------- Firebase SDK --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";

// -------------------- Firebase 설정 --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAUql6jS2F-6tF_8edoNVjDwL1x61KyNKw",
  authDomain: "school-market-5145f.firebaseapp.com",
  projectId: "school-market-5145f",
  storageBucket: "school-market-5145f.firebasestorage.app",
  messagingSenderId: "379957410055",
  appId: "1:379957410055:web:26badd05483dc97bb82da2"
};

// -------------------- 초기화 --------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentRoomId = null;

// -------------------- 로그인 상태 --------------------
onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadItems();
  } else {
    document.getElementById("auth").style.display = "block";
    document.getElementById("app").style.display = "none";
  }
});

// -------------------- 회원가입 --------------------
window.signUp = async () => {
  const email = val("email");
  const password = val("password");

  const user = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(user.user);

  alert("이메일 인증 후 로그인");
};

// -------------------- 로그인 --------------------
window.login = async () => {
  await signInWithEmailAndPassword(auth, val("email"), val("password"));
};

// -------------------- 로그아웃 --------------------
window.logout = async () => {
  await signOut(auth);
};

// -------------------- 상품 등록 --------------------
window.addItemWithImage = async () => {
  const title = val("title");
  const price = val("price");
  const file = document.getElementById("image").files[0];

  if (!title || !price || !file) return alert("모두 입력");

  const fileRef = ref(storage, `items/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const imageUrl = await getDownloadURL(fileRef);

  await addDoc(collection(db, "items"), {
    title,
    price,
    imageUrl,
    sellerId: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });

  clear("title", "price", "image");
};

// -------------------- 상품 목록 --------------------
function loadItems() {
  const q = query(collection(db, "items"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    const div = document.getElementById("items");
    div.innerHTML = "";

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;

      div.innerHTML += `
        <div>
          <img src="${d.imageUrl}" width="100">
          <div>${d.title} - ${d.price}원</div>
          <button onclick="startChat('${id}', '${d.sellerId}')">채팅</button>
        </div>
      `;
    });
  });
}

// -------------------- 🔥 1:1 채팅 (완전 수정됨) --------------------
window.startChat = async (itemId, sellerId) => {
  const buyerId = auth.currentUser.uid;

  if (buyerId === sellerId) {
    alert("본인 상품");
    return;
  }

  // 🔥 항상 동일한 채팅방 ID 생성 (핵심 해결)
  const ids = [buyerId, sellerId].sort();
  currentRoomId = itemId + "_" + ids[0] + "_" + ids[1];

  console.log("채팅방:", currentRoomId);

  loadMessages(currentRoomId);
};

// -------------------- 메시지 보내기 --------------------
window.sendChatMessage = async () => {
  const text = val("messageInput");
  if (!text || !currentRoomId) return;

  await addDoc(collection(db, `chatRooms/${currentRoomId}/messages`), {
    senderId: auth.currentUser.uid,
    text,
    createdAt: serverTimestamp()
  });

  clear("messageInput");
};

// -------------------- 메시지 로딩 --------------------
function loadMessages(roomId) {
  const q = query(
    collection(db, `chatRooms/${roomId}/messages`),
    orderBy("createdAt")
  );

  onSnapshot(q, (snapshot) => {
    const div = document.getElementById("chat");
    div.innerHTML = "";

    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      const me = m.senderId === auth.currentUser.uid;
      div.innerHTML += `<div>${me ? "나" : "상대"}: ${m.text}</div>`;
    });

    div.scrollTop = div.scrollHeight;
  });
}

// -------------------- 유틸 --------------------
function val(id) {
  return document.getElementById(id).value;
}

function clear(...ids) {
  ids.forEach(id => document.getElementById(id).value = "");
}
