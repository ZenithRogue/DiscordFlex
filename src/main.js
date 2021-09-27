import Vue from "vue";
import App from "./App.vue";
import Token from "./Token.vue";
import store from "./store";

import VueTimeago from "vue-timeago";
import VueChatScroll from "vue-chat-scroll";
import VueTextareaAutosize from "vue-textarea-autosize";

import "@/assets/style.css";
import "@/assets/hljs.css";

Vue.config.productionTip = false;

Vue.use(VueTimeago, {
  name: "Timeago", // Component name, `Timeago` by default
  locale: "en" // Default locale
  // We use `date-fns` under the hood
  // So you can use all locales from it
});
Vue.use(VueChatScroll);
Vue.use(VueTextareaAutosize);

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