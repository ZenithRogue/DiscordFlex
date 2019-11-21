<template>
    <img class="server" :src="iconURL" @click="selectGuild" :title="guild.name">
</template>

<script>
import { url } from '@/config';

export default {
    name: 'Guild',
    props: ['guild'],
    methods: {
        selectGuild() {
            this.$store.commit('setActiveGuild',this.guild.id);
        }
    },
    computed: {
        iconURL() {
            if (this.guild.icon) {
                return url + `icons/${this.guild.id}/${this.guild.icon}`;
            } else {
                if (!this.guild.name) return 'https://via.placeholder.com/256/2C2F33/FFFFFF?text=ERROR';
                let texts = this.guild.name.split(/ +/);
                let text = '';
                texts.forEach(chars => {
                    text += chars.charAt(0);
                });
                return 'https://via.placeholder.com/256/2C2F33/FFFFFF?text=' + text;
            }
        }
    }
}
</script>

<style scoped>
    img {
        cursor: pointer;
    }
</style>