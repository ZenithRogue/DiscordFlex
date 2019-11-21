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
      </div>
      <div class="channelBar">
        <div class="title">
          <h3 v-if="activeGuild">{{ activeGuild }}</h3>
        </div>
        <Channels></Channels>
      </div>

      <Chat></Chat>
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
import { url } from "@/config";

export default {
  name: "app",
  data() {
    return {
      logo: Logo
    };
  },
  methods: {
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
    }
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
