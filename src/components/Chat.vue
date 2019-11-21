<template>
  <div class="chat">
    <div class="navbar">
      <img class="navLogo" :src="logo" />
      <img class="navUser" :src="avatarURL" @click="refresh" />
    </div>
    <div class="thread" v-chat-scroll="{ always: false, smooth: true }">
      <infinite-loading
        direction="top"
        @infinite="fetchMessages"
      ></infinite-loading>
      <ChatMessage
        v-for="(message, id) in messages"
        :key="id"
        :message="message"
      ></ChatMessage>
    </div>
    <textarea
      class="compose"
      type="text"
      placeholder="Enter message..."
      v-model="content"
      @keydown.enter.exact.prevent="sendMessage"
      :style="composeHeight"
    ></textarea>
  </div>
</template>

<script>
import ChatMessage from "@/components/Message";
import API from "@/api";
import InfiniteLoading from "vue-infinite-loading";

import EmojiConvertor from "emoji-js";

import Logo from "@/assets/logo.svg";
import { url } from "@/config";

let emoji = new EmojiConvertor();
emoji.text_mode = false;
emoji.replace_mode = "unified";

export default {
  name: "Chat",
  components: {
    ChatMessage,
    InfiniteLoading
  },
  data() {
    return {
      content: "",
      loadingMessages: false,
      logo: Logo
    };
  },
  methods: {
    sendMessage() {
      if (!this.content.length) return;
      API.sendMessage(this.activeChannel, emoji.replace_colons(this.content));
      this.content = "";
    },
    async fetchMessages($state) {
      if (!this.activeChannel) return setTimeout(() => $state.loaded(), 1000);
      let messages = await API.fetchMessages(
        this.activeChannel,
        this.earliestMessage
      );
      messages.forEach(message => {
        this.$store.commit("addToMessageCache", message);
      });
      this.$store.commit("sortMessageCache", this.activeChannel);
      $state.loaded();
    },
    refresh() {
      let reload = confirm(
        "Are you sure you want to reset the token and reload?"
      );
      if (!reload) return;
      localStorage.removeItem("token");
      window.location.reload();
    }
  },
  computed: {
    activeChannel() {
      return this.$store.state.activeChannel;
    },
    messages() {
      return (
        this.$store.state.messageCache[this.$store.state.activeChannel] || {}
      );
    },
    composeHeight() {
      let baseHeight = 30;
      let newLines = this.content.split("\n").length - 1;
      if (newLines > 6) newLines = 6;
      let height = baseHeight + newLines * 20;
      return { height: height + "px" };
    },
    earliestMessage() {
      if (!this.activeChannel) return;
      let cache = this.messages;
      let sorted = Object.values(cache).sort((a, b) => a.id - b.id);
      if (!sorted.length) return;
      return sorted[0].id;
    },
    userData() {
      return this.$store.state.userData;
    },
    avatarURL() {
      if (!this.userData)
        return "https://via.placeholder.com/256/2C2F33/FFFFFF?text=Loading";
      if (this.userData.avatar) {
        return url + `avatars/${this.userData.id}/${this.userData.avatar}`;
      } else {
        let texts = this.userData.name.split(/ +/);
        let text = "";
        texts.forEach(chars => {
          text += chars.charAt(0);
        });
        return "https://via.placeholder.com/256/2C2F33/FFFFFF?text=" + text;
      }
    }
  }
};
</script>
