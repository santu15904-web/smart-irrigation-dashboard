import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue,
  update
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const firestore = getFirestore(app);

let moistureHistory = [];
let timeHistory = [];
let sampleHistory = [];
let lastLoggedTimestamp = "";

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
async function loadHistory() {

    sampleHistory.length = 0;
    timeHistory.length = 0;
    moistureHistory.length = 0;

    const q = query(
        collection(firestore, "history"),
        orderBy("timestamp", "desc"),
        limit(10)
    );

    const querySnapshot = await getDocs(q);

    console.log(
        "History records found:",
        querySnapshot.size
    );

    const tbody = document.getElementById("samplesBody");

    tbody.innerHTML = "";

    querySnapshot.forEach((doc) => {

        const record = doc.data();

        const timeString =
            record.timestamp
                .toDate()
                .toLocaleTimeString();
        timeHistory.unshift(timeString);
        moistureHistory.unshift(record.moisture);

        sampleHistory.push({
            time: timeString,
            moisture: record.moisture,
            raw: record.raw_adc,
            filtered: record.filtered_adc,
            pump: record.pump,
            mode: record.mode
        });

        tbody.innerHTML += `
        <tr>
            <td>${timeString}</td>
            <td>${record.moisture}</td>
            <td>${record.raw_adc}</td>
            <td>${record.filtered_adc}</td>
            <td>${record.pump}</td>
            <td>${record.mode}</td>
        </tr>
        `;

    });

    console.log(
        "sampleHistory loaded:",
        sampleHistory.length
    );
    moistureChart.update();

    console.log(
        "Chart history loaded:",
        moistureHistory.length
    );
}
async function loadStatistics() {

    const yesterday = new Date();

    yesterday.setHours(
        yesterday.getHours() - 24
    );

    const q = query(
        collection(firestore, "history"),
        where(
            "timestamp",
            ">=",
            yesterday
        )
    );

    const querySnapshot =
        await getDocs(q);

    let count = 0;
    let sum = 0;
    let min = 999;
    let max = -999;

    querySnapshot.forEach((doc) => {

        const record = doc.data();

        const moisture =
            Number(record.moisture);

        sum += moisture;

        if (moisture < min)
            min = moisture;

        if (moisture > max)
            max = moisture;

        count++;

    });

    if (count === 0) return;

    const avg =
        (sum / count).toFixed(1);

    document.getElementById(
        "avgMoisture"
    ).innerHTML = avg + "%";

    document.getElementById(
        "minMoisture"
    ).innerHTML = min + "%";

    document.getElementById(
        "maxMoisture"
    ).innerHTML = max + "%";

    document.getElementById(
        "sampleCount"
    ).innerHTML = count;

    console.log(
        "Statistics loaded:",
        count,
        "samples"
    );
}
async function loadEvents() {

    const q = query(
        collection(firestore, "history"),
        orderBy("timestamp", "desc"),
        limit(50)
    );

    const querySnapshot =
        await getDocs(q);

    const records = [];

    querySnapshot.forEach((doc) => {
        records.push(doc.data());
    });

    records.reverse();

    const events = [];

    for (let i = 1; i < records.length; i++) {

        const prev = records[i - 1];
        const curr = records[i];

        const timeString =
            curr.timestamp
                .toDate()
                .toLocaleTimeString();

        if (prev.pump !== curr.pump) {

            events.push(
                `${timeString} - Pump ${curr.pump}`
            );

        }

        if (prev.mode !== curr.mode) {

            events.push(
                `${timeString} - Mode ${curr.mode}`
            );

        }

        if (prev.state !== curr.state) {

            events.push(
                `${timeString} - State ${curr.state}`
            );

        }

    }

    if (events.length === 0) {

        document.getElementById(
            "eventLog"
        ).innerHTML =
            "No events found";

        return;
    }

    document.getElementById(
        "eventLog"
    ).innerHTML =
        events.reverse().join("<br>");

}
loadHistory();
loadStatistics();
loadEvents();

onValue(irrigationRef, (snapshot) => {

    const data = snapshot.val();

    if (!data) return;
    console.log("last_seen =", data.last_seen);
    console.log("Realtime DB callback fired");

    if (data.last_seen !== lastLoggedTimestamp) {

    lastLoggedTimestamp = data.last_seen;

    console.log("About to write Firestore");

    addDoc(
        collection(firestore, "history"),
        {
            moisture: data.moisture,
            raw_adc: data.raw,
            filtered_adc: data.filtered,
            pump: data.pump ? "ON" : "OFF",
            mode: data.mode,
            state: data.state,
            timestamp: new Date()
        }
    )
    .then(() => console.log("Firestore write OK"))
    .catch(err => console.error("Firestore error:", err));

}

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
