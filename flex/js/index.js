var message =
    `<div class="message">
      <img class="profile" src="https://cdn2.scratch.mit.edu/get_image/user/9981676_1024x1024.png"></img>
      <div class="messageStack">
        <div class="user">NitroCipher</div>
        <div class="messageContent">Lorem ipsum dolordsjfklsdjfklsdfj32450234859034589034589023485909324859092384590834905832490583905834905hdfjksldfjkldfgfkl</div>
      </div>
      <div class="info">3/36/18 09:46</div>
    </div>`;

var server = `<img class="server" src="https://cdn2.scratch.mit.edu/get_image/user/1323858_1024x1024.png"></img>`;

var channel =
    `<div class="channel">
      #general
    </div>`;
for (i = 0; i < 50; i++) {
  $(".thread").append(message);
}

for (i = 0; i < 50; i++) {
  $(".serverList").append(server);
}
for (i = 0; i < 50; i++) {
  $(".channelList").append(channel);
}