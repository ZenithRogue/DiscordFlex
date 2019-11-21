<template>
  <div class="message">
    <img class="profile" :src="avatarURL" />
    <div class="messageStack">
      <div class="user">
        <span
          v-bind:style="{ color: message.author.hexColor + 'aa' }"
          :title="message.author.username + '#' + message.author.discriminator"
          >{{ message.member.nickname || message.author.username }}</span
        >
        <div class="info">
          <Timeago :datetime="message.createdAt" :auto-update="60"></Timeago>
          <span v-if="message.edited" style="opacity: 0.5;">(edited)</span>
        </div>
      </div>
      <div class="messageContent">
        <div class="textContent" v-html="textContent"></div>
        <img class="imgContent" v-if="this.message.image" :src="imgContent" />
      </div>
    </div>
  </div>
</template>

<script>
import { url } from "@/config";
import { toHTML } from "discord-markdown";
import twemoji from "twemoji";

export default {
  name: "ChatMessage",
  props: ["message"],
  computed: {
    avatarURL() {
      if (this.message.author.avatar) {
        return (
          url +
          `avatars/${this.message.author.id}/${this.message.author.avatar}`
        );
      } else {
        if (!this.message.author.name)
          return "https://via.placeholder.com/256/2C2F33/FFFFFF?text=ERROR";
        let texts = this.message.author.name.split(/ +/);
        let text = "";
        texts.forEach(chars => {
          text += chars.charAt(0);
        });
        return "https://via.placeholder.com/256/2C2F33/FFFFFF?text=" + text;
      }
    },
    textContent() {
      return twemoji.parse(toHTML(this.message.cleanContent));
    },
    imgContent() {
      return this.message.image[0].url;
    }
  }
};
</script>

<style>
.emoji {
  width: 16px;
  height: 16px;
}
</style>
