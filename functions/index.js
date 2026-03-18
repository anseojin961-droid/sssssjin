const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.kakaoLogin = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "https://dnfl-bdc76.web.app");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

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
});

