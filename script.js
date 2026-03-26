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
  serverTimestamp,
  doc,
  updateDoc
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

// -------------------- 로그인 상태 --------------------
onAuthStateChanged(auth, (user) => {
  const authDiv = document.getElementById("auth");
  const appDiv = document.getElementById("app");

  if (user && user.emailVerified) {
    if (authDiv) authDiv.style.display = "none";
    if (appDiv) appDiv.style.display = "block";

    // 🔥 list.html에서만 실행
    if (document.getElementById("items")) {
      loadItems();
    }

  } else {
    if (authDiv) authDiv.style.display = "block";
    if (appDiv) appDiv.style.display = "none";
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
  const file = document.getElementById("image")?.files[0];

  if (!title || !price || !file) return alert("모두 입력");

  const fileRef = ref(storage, `items/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const imageUrl = await getDownloadURL(fileRef);

  await addDoc(collection(db, "items"), {
    title,
    price,
    imageUrl,
    sellerId: auth.currentUser.uid,
    status: "판매중",
    createdAt: serverTimestamp()
  });

  clear("title", "price", "image");
  alert("등록 완료!");
};

// -------------------- 거래 완료 --------------------
window.completeTrade = async (itemId) => {
  const itemRef = doc(db, "items", itemId);
  await updateDoc(itemRef, {
    status: "판매완료"
  });
};

// -------------------- 상품 목록 --------------------
function loadItems() {
  const q = query(collection(db, "items"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    const div = document.getElementById("items");
    if (!div) return;

    div.innerHTML = "";

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;

      div.innerHTML += `
        <div style="border:1px solid #ccc; padding:10px; margin:10px;">
          <img src="${d.imageUrl}" width="100">
          <div>${d.title} - ${d.price}원</div>
          <div>${d.status}</div>

          ${
            d.status === "판매완료"
              ? `<button disabled>판매완료</button>`
              : `
                <button onclick="startChat('${id}', '${d.sellerId}')">채팅</button>
                ${
                  auth.currentUser.uid === d.sellerId
                    ? `<button onclick="completeTrade('${id}')">거래 완료</button>`
                    : ""
                }
              `
          }
        </div>
      `;
    });
  });
}

// -------------------- 채팅 이동 --------------------
window.startChat = (itemId, sellerId) => {
  const myId = auth.currentUser.uid;

  const ids = [myId, sellerId].sort();
  const roomId = itemId + "_" + ids[0] + "_" + ids[1];

  window.location.href = `chat.html?roomId=${roomId}`;
};

// -------------------- 페이지 이동 --------------------
window.goToList = () => {
  window.location.href = "list.html";
};

window.goToAdd = () => {
  window.location.href = "add.html";
};

window.goBack = () => {
  window.location.href = "index.html";
};

// -------------------- 유틸 --------------------
function val(id) {
  return document.getElementById(id)?.value || "";
}

function clear(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}
