export let url = "127.0.0.1:8083/";
export let protocol = "http";
export let wsprotocol = "ws";
let theToken;
if (localStorage.getItem("token") && localStorage.getItem("token") !== "null") {
  theToken = localStorage.getItem("token");
} else {
  theToken = (() => {
    return null
  })();
}

export let token = theToken;
