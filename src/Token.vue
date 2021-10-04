<template>
  <div id="app">
    <div style="width: fit-content;margin: auto;padding-top: 9%;">
      <div id="qr" v-if="!pfinish"></div>
      <div v-else>
        <img :src="pfpurl">
        <div>{{ username }}</div>
        </div>
      <div>{{ text }}</div>
      <div v-if="!pfinish" @click="inputToken">Or enter a token manually</div>
    </div>
  </div>
</template>

<script>
import { url, protocol, wsprotocol } from "@/config";

export default {
  name: "app",
  data() {
    return {
      pfinish: false,
      username: null,
      pfpurl: null,
      text: "Please Scan the QR Code to log in!",
    };
  },
  methods: {
    inputToken() {
      let token = prompt('Enter a token:')
      localStorage.setItem("token", token)
      window.location.reload();
    }
  },
  mounted: function(){
    let connection = new WebSocket(`${wsprotocol}://${url}login`);
    connection.onmessage = (event) => {
      let json = JSON.parse(event.data);
      let arr;
      switch (json.type) {
        case 'qrCode':
          // eslint-disable-next-line
          new QRCode(document.getElementById("qr"), {
              text: 'https://discord.com/ra/'+json.data,
              logo: "/qrcode.png",
              logoWidth: undefined,
              logoHeight: undefined,
              logoBackgroundColor: '#FFF',
              logoBackgroundTransparent: false
          });
          break;
        case 'pfinish':
          arr = json.data.split(':')
          this.username = arr[3] + '#' + arr[1]
          this.pfpurl = protocol + '://' + url + `avatars/${arr[0]}/${arr[2]}`
          this.text = 'Is this you?'
          this.pfinish = true
          break;
        case 'token':
          localStorage.setItem("token", json.data)
          window.location.reload();
          break;
      }
    }
  }
};
</script>

<style scoped>
img {
  cursor: pointer;
}
</style>
