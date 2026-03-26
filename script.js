// -------------------- Firebase SDK Import --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

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

// -------------------- 로그인 상태 감지 --------------------
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
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해주세요");
    return;
  }

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

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해주세요");
    return;
  }

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

// -------------------- 상품 등록 --------------------
window.addItem = async () => {
  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;

  if (!title || !price) {
    alert("제목과 가격을 입력해주세요");
    return;
  }

  try {
    await addDoc(collection(db, "items"), {
      title,
      price,
      sellerId: auth.currentUser.uid,
      createdAt: new Date()
    });

    document.getElementById("title").value = "";
    document.getElementById("price").value = "";
  } catch (err) {
    alert("상품 등록 실패: " + err.message);
  }
};

// -------------------- 상품 목록 로딩 --------------------
function loadItems() {
  const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const itemsDiv = document.getElementById("items");
    itemsDiv.innerHTML = "";

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      itemsDiv.innerHTML += `<div>${d.title} - ${d.price}원</div>`;
    });
  });
}
