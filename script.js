import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue,
  update
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQny_FSKK9hV2Mndn1VOokGW6oWPv_pDc",
  authDomain: "smart-irrigation-e9bba.firebaseapp.com",
  databaseURL: "https://smart-irrigation-e9bba-default-rtdb.firebaseio.com",
  projectId: "smart-irrigation-e9bba",
  storageBucket: "smart-irrigation-e9bba.firebasestorage.app",
  messagingSenderId: "417468129229",
  appId: "1:417468129229:web:c4833143174fb2371f6e84",
  measurementId: "G-ZC1N2PEL7S"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const irrigationRef = ref(db, "irrigation");

onValue(irrigationRef, (snapshot) => {

  const data = snapshot.val();

  if (!data) return;

  document.getElementById("moisture").innerHTML =
      data.moisture + "% 😊";

  document.getElementById("pump").innerHTML =
      data.pump ? "ON" : "OFF";

  document.getElementById("mode").innerHTML =
      data.mode;

  document.getElementById("state").innerHTML =
      data.state;

  document.getElementById("raw").innerHTML =
      data.raw;

  document.getElementById("filtered").innerHTML =
      data.filtered;

  document.getElementById("last_seen").innerHTML =
      data.last_seen;

  document.getElementById("statusBox").textContent =
`
Moisture : ${data.moisture} %

Pump     : ${data.pump ? "ON" : "OFF"}

Mode     : ${data.mode}

State    : ${data.state}

Raw ADC  : ${data.raw}

Filtered : ${data.filtered}

Last Seen:
${data.last_seen}
`;

});

window.pumpOn = function(){

  update(
    ref(db, "commands"),
    {
      pump: "ON"
    }
  );

}

window.pumpOff = function(){

  update(
    ref(db, "commands"),
    {
      pump: "OFF"
    }
  );

}

window.autoMode = function(){

  update(
    ref(db, "commands"),
    {
      mode: "AUTO"
    }
  );

}

window.manualMode = function(){

  update(
    ref(db, "commands"),
    {
      mode: "MANUAL"
    }
  );

}