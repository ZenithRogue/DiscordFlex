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
        <img class="imgContent" v-if="showImg" :src="imgContent" />
        <img class="vidContent" controls="controls" v-if="showVid" :src="vidContent" />
      </div>
    </div>
  </div>
</template>

<script>
import { url, protocol } from "@/config";
import { toHTML } from "discord-markdown";
import twemoji from "twemoji";

export default {
  name: "ChatMessage",
  props: ["message"],
  methods: {
    proxyLinks(str) {
      str = str.replace("cdn.discordapp.com/", url)
      str = str.replace("media.discordapp.net/", url)
      str = str.replace("https", protocol);
      return str;
    }
  },
  computed: {
    avatarURL() {
      if (this.message.author.avatar) {
        return (
          protocol + '://' + url +
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
      //wip, planning to add support for pasted links instead of just uploaded
      //ie: person X uploads img from device. we can see that.
      // person Y reposts it by clicking "open origional" and pastes that link in another channel. we cannot see that yey
      let msgText = twemoji.parse(toHTML(this.message.cleanContent));
      msgText =  this.proxyLinks(msgText)
      return msgText;
    },
    imgContent() {
      let imgSrc = this.message.image[0].url;
      imgSrc = this.proxyLinks(imgSrc)
      return imgSrc;
    },
    vidContent() {  
      let vidSrc = this.message.image[0].url
      vidSrc = this.proxyLinks(vidSrc)
      return vidSrc
    },
    showImg() {
      let show = false;
      if(this.message.image && /\.(png|gif)$/g.test(this.message.image[0].url)) {
        show = true
      }
      return show;
    },
    showVid() {
      let show = false;
      if(this.message.image && /\.(mov|mp4)$/g.test(this.message.image[0].url)) {
        show = true
      }
      return show;
    },
    
  }
};
</script>

<style>
.emoji {
  width: 16px;
  height: 16px;
}
</style>
