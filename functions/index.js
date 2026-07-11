const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const ALLOWED_ORIGINS = ["https://dnfl-bdc76.web.app", "https://dnfl-bdc76.firebaseapp.com"];
function setCors(req, res) {
  const origin = req.headers.origin;
  res.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

exports.naverLogin = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { code, state } = req.body;
  if (!code) { res.status(400).json({ error: "code required" }); return; }

  try {
    const tokenRes = await axios.post("https://nid.naver.com/oauth2.0/token", null, {
      params: {
        grant_type: "authorization_code",
        client_id: "Hp9CDEZgTHBWGdWLGe0x",
        client_secret: "TeSJJEEyVe",
        code,
        state
      }
    });
    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const naverUser = userRes.data.response;
    const uid = `naver:${naverUser.id}`;
    const email = naverUser.email || `naver_${naverUser.id}@naver.user`;
    const name = naverUser.name || naverUser.nickname || "네이버 사용자";

    try {
      await admin.auth().updateUser(uid, { displayName: name, email });
    } catch(e) {
      if (e.code === "auth/user-not-found") {
        try {
          await admin.auth().createUser({ uid, displayName: name, email });
        } catch(e2) {
          if (e2.code === "auth/email-already-exists") {
            await admin.auth().createUser({ uid, displayName: name });
          } else { throw e2; }
        }
      } else { throw e; }
    }

    const customToken = await admin.auth().createCustomToken(uid);
    res.json({ customToken });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
exports.kakaoLogin = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { code } = req.body;
  if (!code) { res.status(400).json({ error: "code required" }); return; }

  try {
    const tokenRes = await axios.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
          grant_type: "authorization_code",
          client_id: "2a71f06d5335fc05a0917d34b923d609",
          client_secret: "30vMgD05yTFnrC056rmo0ncoP8yNT76p",
          redirect_uri: "https://dnfl-bdc76.web.app/kakao-callback",
          code
        }
    });
    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const kakaoUser = userRes.data;
    const uid = `kakao:${kakaoUser.id}`;
    const email = (kakaoUser.kakao_account && kakaoUser.kakao_account.email) ? kakaoUser.kakao_account.email : `kakao_${kakaoUser.id}@kakao.user`;
    const name = (kakaoUser.kakao_account && kakaoUser.kakao_account.profile && kakaoUser.kakao_account.profile.nickname) ? kakaoUser.kakao_account.profile.nickname : `카카오${kakaoUser.id}`;

    try {
      await admin.auth().updateUser(uid, { displayName: name, email });
    } catch(e) {
      await admin.auth().createUser({ uid, displayName: name, email });
    }

    const customToken = await admin.auth().createCustomToken(uid);
    res.json({ customToken });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
})
exports.coupleJudge = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { myStory, partnerStory } = req.body;
  if (!myStory || !partnerStory) { res.status(400).json({ error: "내용을 입력해주세요." }); return; }

  try {
    const response = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `커플 싸움 판정을 해줘. 아래 두 사람의 입장을 듣고 누구의 잘못인지, 각각 몇 퍼센트 잘못인지 판정해줘. 재미있고 공정하게 판단해줘.

A의 입장: ${myStory}

B의 입장: ${partnerStory}

판정 형식:
- A 잘못: XX%
- B 잘못: XX%
- 판정 이유: (2-3문장)
- 조언: (1문장)`
      }]
    }, {
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      }
    });

    const result = response.data.content[0].text;
    res.json({ result });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
exports.dateCourse = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { location, mood, budget } = req.body;
  if (!location) { res.status(400).json({ error: "위치를 입력해주세요." }); return; }

  try {
    const response = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `커플 데이트 코스를 추천해줘.

위치: ${location}
분위기: ${mood || "자유롭게"}
예산: ${budget || "자유롭게"}

중요: 반드시 "${location}" 주변 반경 5km 이내의 실제 장소만 추천해줘. 다른 동네 장소는 절대 추천하지 마.

추천 형식:
📍 코스 이름
1. 장소명 - 간단한 설명
2. 장소명 - 간단한 설명
3. 장소명 - 간단한 설명
💡 팁: (한 줄 조언)`
      }]
    }, {
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      }
    });

    res.json({ result: response.data.content[0].text });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
exports.sendNotification = functions.https.onRequest(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { token, title, body } = req.body;
  if (!token) { res.status(400).json({ error: "token required" }); return; }

  try {
    const authHeader = req.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "auth required" });
      return;
    }
    await admin.auth().verifyIdToken(authHeader.slice("Bearer ".length));

    const safeTitle = String(title || "새 알림").slice(0, 100);
    const safeBody = String(body || "").slice(0, 180);
    await admin.messaging().send({
      token,
      data: {
        title: safeTitle,
        body: safeBody,
        url: "https://dnfl-bdc76.web.app/"
      },
      webpush: {
        fcmOptions: {
          link: "https://dnfl-bdc76.web.app/"
        }
      }
    });
    res.json({ success: true });
  } catch(e) {
    console.error(e);
    const invalidTokenCodes = new Set([
      "messaging/invalid-argument",
      "messaging/invalid-registration-token",
      "messaging/registration-token-not-registered"
    ]);
    if (invalidTokenCodes.has(e.code)) {
      res.status(410).json({ error: e.message, code: e.code, invalidToken: true });
      return;
    }
    res.status(500).json({ error: e.message });
  }
});
