// -------------------- Firebase SDK --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
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
onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadItems();
    loadMessages();
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
      itemsDiv.innerHTML += `<div><img src="${d.imageUrl}" width="100"><br>${d.title} - ${d.price}원</div>`;
    });
  });
}

// -------------------- 채팅 기능 --------------------
const messagesRef = collection(db, "messages");

window.sendMessage = async () => {
  const text = document.getElementById("messageInput").value;
  if (!text) return;
  await addDoc(messagesRef, {
    senderId: auth.currentUser.uid,
    text,
    createdAt: new Date()
  });
  document.getElementById("messageInput").value = "";
};

function loadMessages() {
  const q = query(messagesRef, orderBy("createdAt"));
  onSnapshot(q, snapshot => {
    const chatDiv = document.getElementById("chat");
    chatDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      chatDiv.innerHTML += `<div>${m.senderId}: ${m.text}</div>`;
    });
    chatDiv.scrollTop = chatDiv.scrollHeight;
  });
}
