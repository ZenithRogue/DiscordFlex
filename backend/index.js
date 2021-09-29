/* eslint-disable no-console */
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const crypto = require("crypto").webcrypto;
const btoa = require("btoa");
const atob = require("atob");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const WebSocket = require('ws');
const { Client } = require("discord.js");
const Joi = require("joi");

let port = 8083;
const iconBase = "https://cdn.discordapp.com/icons/";
const pfpBase = "https://cdn.discordapp.com/avatars/";
const inviteBase = "https://discordapp.com/api/v8/invites/";
const emojibase = "https://cdn.discordapp.com/emojis/";
const attachBase = "https://media.discordapp.net/attachments/";

let loginSchema = Joi.object()
  .keys({
    email: Joi.string().email({
      minDomainAtoms: 2
    }),
    password: Joi.string(),
    token: Joi.string()
  })
  .with("email", "password")
  .without("password", "token");

let sendSchema = Joi.object().keys({
  content: Joi.string()
    .min(1)
    .max(2000),
  channel: Joi.string()
});


var loginSocket = new WebSocket.Server({server: http, path: "/login"});
loginSocket.on('connection', (clientWs) =>{
  clientWs.on('error', (err) => {console.log(err.stack)})
  function binaryToString(binary) {
      return String.fromCharCode.apply(String, new Uint8Array(binary));
  }
  function base64ToBinary(string) {
      return Uint8Array.from(atob(string), str => str.charCodeAt(0));
  }
  function generateKeyPair() {
      return crypto.subtle.generateKey({
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256"
      }, true, ["decrypt"]);
  }
  function exportPublicKey(key) {
      return crypto.subtle.exportKey("spki", key.publicKey).then(res => {
          return btoa(binaryToString(res));
      });
  }
  function decrypt(key, message) {
      return crypto.subtle.decrypt({
          name: "RSA-OAEP"
      }, key.privateKey, base64ToBinary(message));
  }
  function hash(message) {
      return crypto.subtle.digest("SHA-256", message).then(hash => {
          return btoa(binaryToString(hash))
              .replace(/\//g, "_")
              .replace(/\+/g, "-")
              .replace(/={1,2}$/, "");
      });
  }
  let discordWs = new WebSocket("wss://remote-auth-gateway.discord.gg/?v=1", {'origin': 'https://discord.com'});
  let KEY;
  discordWs.on('error', (e) => {console.log(e.stack)})
  discordWs.onmessage = function ({ data }) {
      data = JSON.parse(data);

      switch (data.op) {
          case "hello":
              generateKeyPair().then(key => {
                  exportPublicKey(key).then(encoded_public_key => {
                      KEY = key;
                      discordWs.send(JSON.stringify({
                          op: "init",
                          encoded_public_key
                      }));
                  });
              });
              break;

          case "nonce_proof":
              decrypt(KEY, data.encrypted_nonce).then(hash).then(proof => {
                  discordWs.send(JSON.stringify({
                      op: "nonce_proof",
                      proof
                  }));
              });
              break;

          case "pending_remote_init":
              clientWs.send(JSON.stringify({'type':'qrCode','data':data.fingerprint}))
              break;

          

          case "pending_finish":
              decrypt(KEY, data.encrypted_user_payload).then(binaryToString).then(user => {
                clientWs.send(JSON.stringify({'type':'pfinish','data': user}))
              });
              break;

          case "finish":
              decrypt(KEY, data.encrypted_token).then(binaryToString).then(token => {
                  fetch('https://discordapp.com/api/v8/users/@me', {
                      headers: {
                          Authorization: token
                      }
                  })
                      .then(async () => {
                          clientWs.send(JSON.stringify({'type':'token','data': token}))
                      })
              });
              break;
      }
  };
})
io.on("connection", socket => {
  console.log("Connected to socket");

  let loggedIn = false;

  const client = new Client();
  socket.on("login", async (data, callback) => {
    if (loggedIn) return;
    if (typeof callback != "function") return socket.disconnect();
    let result = await Joi.validate(data, loginSchema).catch(() => false);
    if (result === false) return socket.disconnect();
    client.on("ready", () => {
      loggedIn = true;
      callback(true);
      setupClient(client);
    });

    function catchError(err) {
      callback(err.message);
      socket.disconnect();
    }

    if (result.token) {
      await client.login(result.token).catch(catchError);
    } else {
      await client.login(result.email, result.password).catch(catchError);
    }
  });

  function setupClient(client) {
    let guilds = client.guilds.map((guild, index) =>
      Object.assign({}, guild, {
        channels: guild.channels
          .filter(channel =>
            channel.memberPermissions(guild.me).has("VIEW_CHANNEL")
          )
          .map(parseChannel),
        position: guild.position,
        index: index
      })
    );
    if (!client.user.bot) {
      guilds = guilds.sort(function(a, b) {
        if (a.position < b.position) return -1;
        if (a.position > b.position) return 1;
        return b.index - a.index
      });
    }

    socket.emit("guilds", guilds);

    socket.emit("userData", {
      avatar: client.user.avatar,
      id: client.user.id,
      username: client.user.username
    });

    function parseMessage(msg) {
      var attachments = [];
      msg.attachments.forEach(function(attachment) {
        attachments.push({
          id: attachment.id,
          url: attachment.url,
          proxyUrl: attachment.proxyUrl,
          width: attachment.width,
          height: attachment.height
        });
      });
      //console.log(msg.member ? msg.member.displayHexColor : "#fafafb");
      return {
        id: msg.id,
        channel_id: msg.channel.id,
        guild_id: msg.guild ? msg.guild.id : null,
        content: msg.content,
        createdAt: msg.createdAt,
        cleanContent: msg.cleanContent,
        edited: msg.editedTimestamp,
        member: {
          nickname: msg.member ? msg.member.nickname : false
        },
        author: {
          username: msg.author.username,
          discriminator: msg.author.discriminator,
          id: msg.author.id,
          avatar: msg.author.avatar,
          hexColor: msg.member
            ? msg.member.displayHexColor == "#000000"
              ? "#fafafb"
              : msg.member.displayHexColor
            : "#fafafb"
        },
        image: attachments.length > 0 ? attachments : null
        // image: msg.embeds.length > 0 ? msg.embeds[0].url : "father"
      };
    }

    function parseChannel(channel) {
      return {
        id: channel.id,
        guild_id: channel.guild ? channel.guild.id : null,
        name: channel.name
          ? channel.name
          : channel.recipient
          ? channel.recipient.username
          : "Unknown Name",
        lastMessageID: channel.lastMessageID || 0,
        type: channel.type,
        position: channel.position
      };
    }

    socket.on("fetchMessages", async ({ id, msg }, callback) => {
      if (typeof callback != "function") return;
      if (typeof id !== "string") return;
      // if (!client.channels.has(id)) return;
      let channel = client.channels.find(c => c.id == id);
      if (!["text", "dm", "group"].includes(channel.type)) return;
      let data = {
        limit: 50
      };
      if (typeof msg == "string") data.before = msg;
      let messages = await channel.fetchMessages(data);
      messages = messages
        .map(parseMessage)
        .sort((a, b) => a.createdAt - b.createdAt);
      callback(messages);
    });

    socket.on("fetchDMs", async callback => {
      if (typeof callback != "function") return;
      let channels = client.channels
        .filter(c => c.type == "dm" || c.type == "group")
        .map(parseChannel)
        .sort((a, b) => b.lastMessageID - a.lastMessageID);

      callback(channels);
    });

    socket.on("sendMessage", async data => {
      let result = await Joi.validate(data, sendSchema).catch(() => false);
      if (!result) return;
      if (!client.channels.has(data.channel)) return;
      client.channels.get(data.channel).send(data.content);
    });

    client.on("message", msg => {
      socket.emit("message", parseMessage(msg));
    });

    client.on("messageUpdate", (old, msg) => {
      socket.emit("message", parseMessage(msg));
    });

    client.on("messageDelete", msg => {
      socket.emit("messageDelete", parseMessage(msg));
    });

    client.on("messageDeleteBulk", messages => {
      socket.emit("messageDelete", messages.map(parseMessage));
    });
    // client.on("raw", d => {
    //     switch (d.t) {
    //         case "MESSAGE_CREATE":
    //             d.d.createdAt = Date.parse(d.d.timestamp);
    //             socket.emit("message", d.d);
    //     }
    // });
  }
});
app.use(express.static(path.resolve(__dirname, "../dist")));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, Authorization, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/icons/:server/:id", (req, res) => {
  fetch(`${iconBase}/${req.params.server}/${req.params.id}`, {
    method: "GET"
  }).then(async resp => {
    if (resp.ok) {
      res.end(await resp.buffer());
    } else {
      res.sendStatus(resp.status);
    }
  });
});

app.get("/avatars/:user/:id", (req, res) => {
  fetch(`${pfpBase}/${req.params.user}/${req.params.id}.png`, {
    method: "GET"
  }).then(async resp => {
    if (resp.ok) {
      res.end(await resp.buffer());
    } else {
      res.sendStatus(resp.status);
    }
  });
});
app.get("/emojis/:url", (req, res) => {
  fetch(`${emojibase}${req.params.url}`, {
    method: "GET"
  }).then(async resp => {
    if (resp.ok) {
      res.end(await resp.buffer());
    } else {
      res.sendStatus(resp.status);
    }
  });
});

app.get("/attachments/:guild/:id/:fname", (req, res) => {
  fetch(`${attachBase}${req.params.guild}/${req.params.id}/${req.params.fname}`, {
    method: "GET"
  }).then(async resp => {
    if (resp.ok) {
      if (req.params.fname.includes('mp4') || req.params.fname.includes('mov')) { return await resp.body.pipe(res) }
      res.append('content-type', 'video/mp4')
      res.end(await resp.buffer());
    } else {
      res.sendStatus(resp.status);
    }
  });
});

app.get("/invites/:invite", (req, res) => {
  fetch(`${inviteBase}${req.params.invite}`, {
    method: "GET"
  }).then(async resp => {
    if (resp.ok) {
        res.end(await resp.buffer());
    } else {
        res.sendStatus(resp.status);
    }
  });
});
app.post("/invites/:invite", (req, res) => {
  fetch(`${inviteBase}${req.params.invite}`, {
    method: "POST",
    headers: { 'Authorization': req.headers.authorization }
  }).then(async resp => {
    if (resp.ok) {
      res.end(await resp.buffer());
    } else {
      res.sendStatus(resp.status);
    }
  });
});

http.listen(port, "0.0.0.0", () => {
  console.log("Server listening on port " + port);
});
