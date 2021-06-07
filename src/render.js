const { desktopCapturer, remote } = require("electron");
const { dialog } = remote;
const { writeFile } = require("fs");
const { Menu } = remote;

let mediaRecorder;
const recordedChunks = [];

const videoElement = document.querySelector("video");

const startBtn = document.getElementById("startBtn");
startBtn.onclick = (e) => {
    mediaRecorder.start();
    startBtn.classList.remove("bg-blue-500");
    startBtn.classList.add("bg-red-500");
    startBtn.classList.add("border-red-500");
    startBtn.innerText = "Recording";
};

const stopBtn = document.getElementById("stopBtn");
stopBtn.onclick = (e) => {
    mediaRecorder.stop();
    startBtn.classList.remove("border-red-500");
    startBtn.classList.remove("bg-red-500");
    startBtn.innerText = "Start";
};

const videoSelectBtn = document.getElementById("videoSelectBtn");

videoSelectBtn.onclick = getVideoSources;

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"],
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map((source) => {
            return {
                label: source.name,
                click: () => selectSource(source),
            };
        })
    );

    videoOptionsMenu.popup();
}

async function selectSource(source) {
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: source.id,
            },
        },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;

    videoElement.play();

    const options = { mimeType: "video/webm; codec=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
    console.log("Video data available");
    recordedChunks.push(e.data);
}

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: "video/webm; codecs=vp9",
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: "Save video",
        defaultPath: `vid-${Date.now()}.webm`,
    });

    console.log(filePath);

    writeFile(filePath, buffer, () => console.log("Video saved successfully!"));
}
