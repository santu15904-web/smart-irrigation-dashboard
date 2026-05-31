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

let moistureHistory = [];
let timeHistory = [];
let sampleHistory = [];

const chartCtx = document.getElementById("moistureChart");

const moistureChart = new Chart(chartCtx, {
    type: "line",
    data: {
        labels: timeHistory,
        datasets: [{
            label: "Moisture %",
            data: moistureHistory,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        animation: false,
        scales: {
            y: {
                min: 0,
                max: 110
            }
        }
    }
});

const irrigationRef = ref(db, "irrigation");

onValue(irrigationRef, (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    /* Moisture */

    document.getElementById("moisture").innerHTML =
        data.moisture + "%";

    /* Emoji */

    let emoji = "😊";

    if (data.moisture < 40) {
        emoji = "😡";
    }
    else if (data.moisture < 70) {
        emoji = "😐";
    }

    document.getElementById("emoji").innerHTML = emoji;

    /* Status Cards */

    document.getElementById("pump").innerHTML =
        data.pump ? "ON" : "OFF";

    document.getElementById("mode").innerHTML =
        data.mode;

    document.getElementById("state").innerHTML =
        data.state;

    /* Chart */

    const now = new Date();
    const timeString = now.toLocaleTimeString();

    timeHistory.push(timeString);
    moistureHistory.push(data.moisture);

    if (timeHistory.length > 20) {
        timeHistory.shift();
        moistureHistory.shift();
    }

    moistureChart.update();

    /* Recent Samples Table */

    sampleHistory.unshift({
        time: timeString,
        moisture: data.moisture,
        raw: data.raw,
        filtered: data.filtered,
        pump: data.pump ? "ON" : "OFF",
        mode: data.mode
    });

    if (sampleHistory.length > 10) {
        sampleHistory.pop();
    }

    const tbody = document.getElementById("samplesBody");

    tbody.innerHTML = "";

    sampleHistory.forEach(sample => {

        tbody.innerHTML += `
        <tr>
            <td>${sample.time}</td>
            <td>${sample.moisture}</td>
            <td>${sample.raw}</td>
            <td>${sample.filtered}</td>
            <td>${sample.pump}</td>
            <td>${sample.mode}</td>
        </tr>
        `;

    });

});

/* Controls */

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
