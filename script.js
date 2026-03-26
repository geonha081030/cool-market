// -------------------- Firebase SDK --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";

// -------------------- Firebase 초기화 --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAUql6jS2F-6tF_8edoNVjDwL1x61KyNKw",
  authDomain: "school-market-5145f.firebaseapp.com",
  projectId: "school-market-5145f",
  storageBucket: "school-market-5145f.firebasestorage.app",
  messagingSenderId: "379957410055",
  appId: "1:379957410055:web:26badd05483dc97bb82da2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// -------------------- 로그인 상태 --------------------
let currentChatItemId = null;
let currentSellerId = null;
let currentBuyerId = null;

onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadItems();
    if (currentChatItemId) loadChatMessages(currentChatItemId, currentSellerId, currentBuyerId);
  } else {
    document.getElementById("auth").style.display = "block";
    document.getElementById("app").style.display = "none";
  }
});

// -------------------- 회원가입 --------------------
window.signUp = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요");

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCred.user);
    alert("회원가입 완료! 이메일 인증 후 로그인해주세요.");
  } catch (err) {
    alert("회원가입 실패: " + err.message);
  }
};

// -------------------- 로그인 --------------------
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요");

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert("로그인 실패: " + err.message);
  }
};

// -------------------- 로그아웃 --------------------
window.logout = async () => {
  await signOut(auth);
};

// -------------------- 상품 등록 (이미지 포함) --------------------
window.addItemWithImage = async () => {
  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;
  const file = document.getElementById("image").files[0];

  if (!title || !price || !file) return alert("제목, 가격, 이미지를 모두 입력해주세요");

  try {
    const fileRef = ref(storage, `items/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const imageUrl = await getDownloadURL(fileRef);

    await addDoc(collection(db, "items"), {
      title,
      price,
      imageUrl,
      sellerId: auth.currentUser.uid,
      createdAt: new Date()
    });

    document.getElementById("title").value = "";
    document.getElementById("price").value = "";
    document.getElementById("image").value = "";
  } catch (err) {
    alert("상품 등록 실패: " + err.message);
  }
};

// -------------------- 상품 목록 --------------------
function loadItems() {
  const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const itemsDiv = document.getElementById("items");
    itemsDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const itemId = docSnap.id;
      itemsDiv.innerHTML += `
        <div>
          <img src="${d.imageUrl}" width="100"><br>
          ${d.title} - ${d.price}원
          <button onclick="startChat('${itemId}', '${d.sellerId}', '${auth.currentUser.uid}')">채팅 시작</button>
        </div>
      `;
    });
  });
}

// -------------------- 1:1 채팅 --------------------
window.startChat = (itemId, sellerId, buyerId) => {
  currentChatItemId = itemId;
  currentSellerId = sellerId;
  currentBuyerId = buyerId;
  loadChatMessages(itemId, sellerId, buyerId);
};

window.sendChatMessage = async () => {
  const text = document.getElementById("messageInput").value;
  if (!text || !currentChatItemId) return;
  const userId = auth.currentUser.uid;

  if (userId !== currentSellerId && userId !== currentBuyerId) return alert("권한이 없습니다.");

  await addDoc(collection(db, `items/${currentChatItemId}/messages`), {
    senderId: userId,
    text,
    createdAt: new Date()
  });
  document.getElementById("messageInput").value = "";
};

function loadChatMessages(itemId, sellerId, buyerId) {
  const messagesRef = collection(db, `items/${itemId}/messages`);
  const q = query(messagesRef, orderBy("createdAt"));
  onSnapshot(q, snapshot => {
    const chatDiv = document.getElementById("chat");
    chatDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      const senderLabel = m.senderId === auth.currentUser.uid ? "나" : "상대";
      chatDiv.innerHTML += `<div>${senderLabel}: ${m.text}</div>`;
    });
    chatDiv.scrollTop = chatDiv.scrollHeight;
  });
}
