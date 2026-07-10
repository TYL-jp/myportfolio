// Adapted from the production recorder.js — recording runs fully in-browser for this demo.
let mediaRecorder;
let audioChunks = [];
let stream;
let timerInt;
let autoStopTimeout;
let isRecording = false;

// DOM
const micBtn = document.getElementById('mic-btn');
const resetBtn = document.getElementById('btn-reset');
const timerText = document.getElementById('timer');
const userAudio = document.getElementById('audio-playback');

function updateUI(state) {
    if (!micBtn) return;
    micBtn.classList.remove('recording', 'saved');

    const infoText = document.getElementById('info-text');

    if (state === 'idle') {
        document.getElementById('btn-analyze').disabled = true;
        isRecording = false;
        micBtn.disabled = false;
        micBtn.innerHTML = '<span class="material-icons">mic</span>';
        resetBtn.disabled = true;
        infoText.textContent = '録音ボタンを押して、裏声を出してください。';
        timerText.textContent = '5';
        timerText.style.opacity = '0';
        // Clear player without triggering Safari's error state
        userAudio.removeAttribute('src');
        userAudio.load();

    } else if (state === 'recording') {
        document.getElementById('btn-analyze').disabled = true;
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.innerHTML = '<span class="material-icons">stop</span>';
        resetBtn.disabled = true;
        infoText.textContent = '録音中...';
        timerText.style.opacity = '1';

    } else if (state === 'saved') {
        document.getElementById('btn-analyze').disabled = false;
        isRecording = false;
        micBtn.disabled = true; // Disabled after recording until reset
        micBtn.classList.add('saved');
        micBtn.innerHTML = '<span class="material-icons">check</span>';
        resetBtn.disabled = false;
        infoText.textContent = '録音が完了しました。分析ボタンを押してください。';
        timerText.style.opacity = '0';
    }
}

const RECORD_LIMIT = 5;

function startCircleCountdown() {
    let remaining = RECORD_LIMIT;
    clearInterval(timerInt);

    timerText.style.display = 'flex';
    timerText.className = 'timer-circle';
    timerText.textContent = remaining;

    timerInt = setInterval(() => {
        remaining--;

        timerText.classList.remove('shrink');
        void timerText.offsetWidth;
        timerText.classList.add('shrink');

        if (remaining > 1) {
            timerText.textContent = remaining;
        }
        else if (remaining === 1) {
            timerText.textContent = '1';
            timerText.classList.add('final');
        }
        else {
            clearInterval(timerInt);
            timerText.textContent = '';
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }
    }, 1000);
}

async function startRec() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: {
            noiseSuppression: false,
            autoGainControl: true,
            echoCancellation: false
        } });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            // Use the browser's actual recording format (Safari: mp4/aac, Chrome: webm)
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const blob = new Blob(audioChunks, { type: mimeType });
            userAudio.src = URL.createObjectURL(blob);
            clearInterval(timerInt);
            // In production this uploads to Flask (/upload-audio). Demo: local only.
            updateUI('saved');
        };

        mediaRecorder.start();
        startCircleCountdown();
        updateUI('recording');

        // 5s Limit
        autoStopTimeout = setTimeout(() => {
            if (mediaRecorder.state === 'recording') mediaRecorder.stop();
        }, 5000);

    } catch (e) {
        console.error(e);
        const errorDiv = document.getElementById('analyze-error');
        if (errorDiv) errorDiv.textContent = 'マイクへのアクセスが許可されていません。';
    }
}

// Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateUI('idle');

    micBtn.addEventListener('click', () => {
        const errorDiv = document.getElementById('analyze-error');
        if (errorDiv) errorDiv.textContent = '　';

        if (isRecording) {
            clearTimeout(autoStopTimeout);
            if (mediaRecorder) mediaRecorder.stop();
        } else {
            startRec();
        }
    });

    resetBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('resetAllData'));
    });
});
