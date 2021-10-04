<template>
  <div class="channelList">
    <div
      :class="'channel' + (showHover(channel) ? ' selected' : '') + (channel.type == 'category' ? ' category' : '')"
      @mouseover="onHover(channel)"
      @mouseout="onStopHover"
      @click="selectChannel(channel)"
      v-for="channel in channels"
      :key="channel.key"
    >
      <span>{{prefix(channel)}}</span>{{channel.name}}
    </div>
  </div>
</template>

<script>
export default {
  name: "Channels",
  data() {
    return {
      hovering: ""
    };
  },
  computed: {
    channels() {
      return this.$store.state.channels;
    },
    activeChannel() {
      return this.$store.state.activeChannel;
    }
  },
  methods: {
    onHover(channel) {
      this.hovering = channel.id;
    },
    onStopHover() {
      this.hovering = "";
    },
    showHover(channel) {
      return this.activeChannel == channel.id || this.hovering == channel.id && channel.type == 'text';
    },
    selectChannel(channel) {
      if(channel.type != 'text') return;
      localStorage.channel = channel.id
      if(channel.guild_id) {
        localStorage.guild = channel.guild_id
      } else {
        localStorage.removeItem('guild')
      }
      this.$store.dispatch("setActiveChannel", channel.id);
    },
    prefix(channel) {
      switch (channel.type) {
        case "text":
          return "#";
        case 'category':
          return ">";
        case "dm":
          return "@";
        case "group":
          return "#";
      }
    }
  }
};
</script>