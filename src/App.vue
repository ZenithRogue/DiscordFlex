<template>
  <div id="app">
    <div class="mehBody">
      <div class="serverList">
        <img
          class="server"
          :src="avatarURL"
          @click="switchToDMs"
          title="Direct Messages"
        />
        <div class="divider"></div>
        <GuildIcon
          v-for="(guild, id) in guilds"
          :key="id"
          :guild="guild"
        ></GuildIcon>
        <div class="divider"></div>
        <div class="server" style="background: #777">
          <svg class="server" viewBox="0 0 24 24"
            @click="joinServerPopup"
            title="Join a Server">
            <path fill="#777" d="M20 11.1111H12.8889V4H11.1111V11.1111H4V12.8889H11.1111V20H12.8889V12.8889H20V11.1111Z" />
          </svg>
        </div>
      </div>
      <div class="channelBar">
        <div class="title">
          <h3 v-if="activeGuild">{{ activeGuild }}</h3>
        </div>
        <Channels></Channels>
      </div>

      <Chat></Chat>
      <div v-if="blur" @click="closePopup" style="width: 100%;height: 100%;opacity: 0.5;background: #000;position: fixed;"></div>
      <div v-if="joinServer" style="width:25%;background:#36393F;position:fixed;margin-left:37.5%;height:50%;top:25%;border-radius:10px;">
        <div style="height: 100%;width: 100%;position: relative;">
          <img :src="joinServerIcon" style="display: block;margin-left: auto;margin-right: auto;width: 110px;border-radius: 12px;" />
          <div style="font-size: 20px;color: #fff;text-align: center;">{{ joinServerName }}</div>
          <div style="color: #fafafbaa;font-size: 13px;text-align: center;">{{ joinServerDesc }}</div>
          <div style="width: 75%; height: 16%; left: 12.5%; border-radius: 10px; bottom: 0px; position: absolute; background: rgb(108, 110, 114); text-align: center;"><p style="position: relative;top: 10px;" @click="joinServerFnc">Join Server</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Logo from "@/assets/logo.svg";

import Chat from "@/components/Chat";
import Channels from "@/components/Channels";
import GuildIcon from "@/components/GuildIcon";
// eslint-disable-next-line
import API from "@/api";
import { url, protocol, token } from "@/config";

export default {
  name: "app",
  data() {
    return {
      logo: Logo,
      joinServerIcon: 'https://via.placeholder.com/256/2C2F33/FFFFFF?text=Loading...',
      joinServerName: 'Loading...',
      joinServerDesc: 'Loading...',
      joinServerInv: '',
      blur: false,
      joinServer: false,
    };
  },
  methods: {
    closePopup() {
      this.joinServer = false
      this.blur = false
      this.joinServerIcon = "https://via.placeholder.com/256/2C2F33/FFFFFF?text=Loading..."
      this.joinServerName = "Loading..."
      this.joinServerDesc = "Loading..."
    },
    refresh() {
      let reload = confirm(
        "Are you sure you want to reset the token and reload?"
      );
      if (!reload) return;
      localStorage.removeItem("token");
      window.location.reload();
    },
    switchToDMs() {
      this.$store.dispatch("switchToDMs");
    },
    joinServerPopup() {
      let that = this,
          invite = prompt("Server invite?"),
          xhr = new XMLHttpRequest();
      xhr.open("GET", `${protocol}://${url}invites/${invite}`);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          var ginfo = JSON.parse(xhr.responseText);
          that.joinServerInv = ginfo.code
          if(ginfo.icon) {that.joinServerIcon = `${protocol}://${url}icons/${ginfo.guild.id}/${ginfo.guild.icon}`}
          that.joinServerName = ginfo.guild.name
          that.joinServerDesc = ginfo.guild.description
          that.blur = "true"
          that.joinServer = true
        }
      };
      xhr.send();
      return true;
    },
    joinServerFnc() {
      this.closePopup()
      var xhr = new XMLHttpRequest();
      xhr.open("POST", `${protocol}://${url}invites/${this.joinServerInv}`);
      xhr.setRequestHeader("Authorization", token);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          document.location.reload()
        }
      };
      xhr.send();
      this.joinServerInv = ''
    },
  },
  computed: {
    activeGuild() {
      let guild = this.$store.state.activeGuild;
      if (!guild.length) return false;
      if (guild == "DM") return "Direct Messages";
      return this.$store.state.guilds[guild].name;
    },
    guilds() {
      return this.$store.state.guilds;
    },
    userData() {
      return this.$store.state.userData;
    },
    avatarURL() {
      if (!this.userData)
        return "https://via.placeholder.com/256/2C2F33/FFFFFF?text=Loading";
      if (this.userData.avatar) {
        return protocol + '://' + url + `avatars/${this.userData.id}/${this.userData.avatar}`;
      } else {
        let texts = this.userData.name.split(/ +/);
        let text = "";
        texts.forEach(chars => {
          text += chars.charAt(0);
        });
        return "https://via.placeholder.com/256/2C2F33/FFFFFF?text=" + text;
      }
    }
  },
  components: {
    Chat,
    Channels,
    GuildIcon
  }
};
</script>

<style scoped>
img {
  cursor: pointer;
}
</style>
