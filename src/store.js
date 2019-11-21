import Vue from 'vue'
import Vuex from 'vuex'

import API from '@/api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    channels: {},
    guilds: {},
    messageCache: {},
    activeGuild: '',
    activeChannel: '',
    fetchedChannels: [],
    userData: false
  },
  mutations: {
    setUserData(state, data) {
      state.userData = data;
    },
    setGuilds(state, guilds) {
      for (let guild of guilds) {
        Vue.set(state.guilds, guild.id, guild);
      }
    },
    addGuild(state, guild) {
      Vue.set(state.guilds, guild.id, guild)
    },
    setActiveGuild(state, id) {
      state.activeGuild = id;
      let guild = state.guilds[id];
      let channels = {};
      guild.channels.sort((a, b) => a.position - b.position).forEach(channel => {
        if (channel.type != 'text') return;
        channels[channel.id] = channel;
      });
      state.channels = channels;
    },
    switchToDMs(state, channels) {
      state.activeGuild = 'DM';
      state.channels = channels;
    },
    setActiveChannel(state, id) {
      state.activeChannel = id;
    },
    addToMessageCache(state, message) {
      if (!state.fetchedChannels.includes(message.channel_id)) return
      if (!state.messageCache[message.channel_id]) {
        Vue.set(state.messageCache, message.channel_id, {});
      }
      Vue.set(state.messageCache[message.channel_id], message.id, message);
    },
    sortMessageCache(state, id) {
      if (!state.messageCache[id]) return
      let cache = state.messageCache[id];
      let sorted = Object.values(cache).sort((a, b) => a.id - b.id);
      Vue.set(state.messageCache, id, {});
      sorted.forEach(m => {
        Vue.set(state.messageCache[id], m.id, m);
      })
    },
    removeMessageFromCache(state, message) {
      if (state.messageCache[message.channel_id]) {
        Vue.delete(state.messageCache[message.channel_id], message.id, message);
      }
    }
  },
  actions: {
    async setActiveChannel({
      state,
      commit
    }, id) {
      if (state.fetchedChannels.includes(id)) return commit('setActiveChannel', id);
      state.fetchedChannels.push(id);
      commit('setActiveChannel', id);
      let messages = await API.fetchMessages(id);
      messages.forEach(message => {
        commit('addToMessageCache', message);
      });
    },
    async switchToDMs({
      state,
      commit
    }) {
      if (state.activeGuild == 'DM') return;
      let channels = await API.fetchDMs();
      commit('switchToDMs', channels);
    }
  }
})