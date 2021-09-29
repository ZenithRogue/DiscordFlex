import Vue from "vue";
import App from "./App.vue";
import Token from "./Token.vue";
import store from "./store";

import VueTimeago from "vue-timeago";
import VueChatScroll from "vue-chat-scroll";

import "@/assets/style.css";

Vue.config.productionTip = false;

Vue.use(VueTimeago, {locale: "en"});
Vue.use(VueChatScroll);

if(localStorage.getItem("token") && localStorage.getItem("token") !== "null") {
  new Vue({
    store,
    render: h => h(App)
  }).$mount("#app");  
}
else {
  new Vue({
    render: h => h(Token)
  }).$mount("#app");
  
}