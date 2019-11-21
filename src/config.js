export let url = "http://127.0.0.1:8083/";
let theToken;
if (localStorage.getItem("token") && localStorage.getItem("token") !== "null") {
  theToken = localStorage.getItem("token");
} else {
  theToken = (() => {
    localStorage.setItem("token", prompt("Discord Token"));
    return localStorage.getItem("token");
  })();
}

export let token = theToken;
