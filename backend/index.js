const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { Client } = require("discord.js");
const Joi = require("joi");

let port = 8083;
const iconBase = "https://cdn.discordapp.com/icons/";
const pfpBase = "https://cdn.discordapp.com/avatars/";

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

io.on("connection", socket => {
  console.log("Connected to socket");

  let loggedIn = false;

  const client = new Client();
  socket.on("login", async (data, callback) => {
    if (loggedIn) return;
    if (typeof callback != "function") return socket.disconnect();
    let result = await Joi.validate(data, loginSchema).catch(err => false);
    if (result === false) return socket.disconnect();
    client.on("ready", () => {
      loggedIn = true;
      callback(true);
      console.log("Logged in successfully!");
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
    let guilds = client.guilds.map(guild =>
      Object.assign({}, guild, {
        channels: guild.channels
          .filter(channel =>
            channel.memberPermissions(guild.me).has("VIEW_CHANNEL")
          )
          .map(parseChannel),
        position: guild.position
      })
    );

    if (!client.user.bot)
      guilds = guilds.sort((a, b) => a.position - b.position);

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
      let result = await Joi.validate(data, sendSchema).catch(err => false);
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

http.listen(port, "0.0.0.0", () => {
  console.log("Server listening on port " + port);
});
