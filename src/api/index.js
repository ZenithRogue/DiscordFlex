import io from 'socket.io-client'
import {
    token,
    url
} from '@/config'

import store from '@/store'

import EventEmitter from 'events'

let events = {
    guilds(guilds) {
        store.commit('setGuilds', guilds);
    },
    message(msg) {
        store.commit('addToMessageCache', msg);
    },
    messageDelete(msg) {
        store.commit('removeMessageFromCache', msg);
    },
    messageDeleteBulk(messages) {
        messages.forEach(msg => {
            store.commit('removeMessageFromCache', msg);
        });
    },
    userData(data) {
        store.commit('setUserData', data);
    }
}

class API extends EventEmitter {
    constructor(token, url) {
        super();
        let socket = this.socket = io(url);
        this.loggedIn = false;

        for (let event in events) {
            socket.on(event, events[event].bind(this));
        }

        socket.emit('login', {
            token
        }, (success) => {
            if (success === true) {
                if(localStorage.guild) {
                    socket.once('guilds', () => {
                        store.commit('setActiveGuild',localStorage.guild);
                        if(localStorage.channel) {
                            store.dispatch("setActiveChannel", localStorage.channel);
                        } else {
                            store.dispatch("setActiveChannel", store.state.channels[0].id);
                        }
                    })
                } else {
                    store.dispatch("switchToDMs");
                    if(localStorage.channel) {
                        store.dispatch("setActiveChannel", localStorage.channel);
                    } else {
                        this.fetchDMs().then(list => {
                            store.dispatch("setActiveChannel", list[0].id);
                        })
                    }
                }
            } else {
                localStorage.removeItem('token');
                alert('Reload and try again.');
            }
        });
    }

    sendMessage(channel, content) {
        this.socket.emit('sendMessage', {
            channel,
            content
        });
    }

    fetchMessages(channel, msgid = false) {
        return new Promise((resolve) => {
            this.socket.emit('fetchMessages', {
                id: channel,
                msg: msgid
            }, resolve);
        });
    }

    fetchDMs() {
        return new Promise((resolve) => {
            this.socket.emit('fetchDMs', resolve);
        });
    }
}

export default new API(token, url);