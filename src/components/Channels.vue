<template>
  <div class="channelList">
    <div
      :class="'channel' + (showHover(channel) ? ' selected' : '')"
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
      return this.activeChannel == channel.id || this.hovering == channel.id;
    },
    selectChannel(channel) {
      this.$store.dispatch("setActiveChannel", channel.id);
    },
    prefix(channel) {
      switch (channel.type) {
        case "text":
          return "#";
        case "dm":
          return "@";
        case "group":
          return "#";
      }
    }
  }
};
</script>