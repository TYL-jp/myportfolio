// Adapted from the production main.js.
// Production: fetch('/analyze') → Flask → preprocessing → feature extraction → 5x FNN inference.
// Demo: the same UI flow with a simulated progress sequence and representative sample scores.

const progressFill = document.getElementById('progress-fill');
const progressStatusText = document.getElementById('progress-status-text');
const analyzeBtn = document.getElementById('btn-analyze');
const errorDiv = document.getElementById('analyze-error');
const infoText = document.getElementById('info-text');
const progressArea = document.getElementById('progress-area');

// Simulated pipeline stages (mirrors the real Flask /get_status sequence)
const DEMO_STAGES = [
    { status: 'WAV変換中...', percent: '15%' },
    { status: 'ノイズ除去・前処理中...', percent: '35%' },
    { status: '音響特徴量を抽出中...', percent: '60%' },
    { status: 'FNNモデルで推定中...', percent: '85%' },
    { status: '処理完了', percent: '100%' }
];

// Representative result (based on the demo score shown in our research presentation)
const DEMO_RESULT = {
    total_score: 90.8,
    scores: { purity: 91, relaxation: 88, breath_control: 85, resonance: 78, stability: 82 },
    main_advice: 'SS 完璧です！他のピッチでもこのクオリティを維持してみましょう。（デモ用サンプルスコア）'
};

function resetAll() {
    createRadarChart('resultChart', [0, 0, 0, 0, 0]);
    updateUI('idle');

    if (infoText) infoText.textContent = '録音ボタンを押して、裏声を出してください。';
    if (infoText) infoText.style.display = 'block';
    if (progressArea) progressArea.style.display = 'none';

    const resetBtn = document.getElementById('btn-reset');
    resetBtn.disabled = true;
    analyzeBtn.disabled = true;

    document.getElementById('res-total').textContent = '-';
}

function runDemoAnalysis() {
    let i = 0;
    function step() {
        if (i < DEMO_STAGES.length) {
            const s = DEMO_STAGES[i];
            if (progressStatusText) progressStatusText.textContent = s.status;
            if (progressFill) progressFill.style.width = s.percent;
            i++;
            setTimeout(step, 900);
        } else {
            // Show results
            const report = DEMO_RESULT;
            const scores = [
                report.scores.purity,
                report.scores.relaxation,
                report.scores.breath_control,
                report.scores.resonance,
                report.scores.stability
            ];
            if (infoText) infoText.style.display = 'block';
            if (progressArea) progressArea.style.display = 'none';
            infoText.textContent = report.main_advice;
            document.getElementById('res-total').textContent = report.total_score;
            createRadarChart('resultChart', scores);

            analyzeBtn.textContent = '分析';
            document.getElementById('btn-reset').disabled = false;
        }
    }
    step();
}

document.addEventListener('DOMContentLoaded', () => {

    // Initial Chart (Empty)
    if (typeof createRadarChart === 'function') {
        createRadarChart('resultChart', [0, 0, 0, 0, 0]);
    }

    // --- Reset Logic (Listener) ---
    window.addEventListener('resetAllData', resetAll);

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            document.getElementById('btn-reset').disabled = true;
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '...';
            if (errorDiv) errorDiv.textContent = '　';

            // --- UI Switch: Show Progress ---
            if (infoText) infoText.style.display = 'none';
            if (progressArea) progressArea.style.display = 'block';
            if (progressFill) progressFill.style.width = '0%';
            if (progressStatusText) progressStatusText.textContent = '準備中...';

            runDemoAnalysis();
        });
    }
});
