// Radar chart renderer (Chart.js) — 5 evaluation axes of MY JAKOSY
let radarChartInstance = null;

function createRadarChart(canvasId, scores) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Graceful fallback if the Chart.js CDN is unavailable
    if (typeof Chart === 'undefined') {
        const wrapper = ctx.parentElement;
        if (wrapper && !wrapper.querySelector('.chart-fallback')) {
            const note = document.createElement('div');
            note.className = 'chart-fallback';
            note.style.cssText = 'color:#9e9e9e;font-size:0.9rem;text-align:center;';
            note.textContent = 'レーダーチャートの読み込みに失敗しました（オフライン環境）。';
            wrapper.appendChild(note);
        }
        return;
    }

    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['純度', '力みの無さ', '息漏れの少なさ', '響きの豊かさ', '安定性'],
            datasets: [{
                label: 'スコア',
                data: scores,
                fill: true,
                backgroundColor: 'rgba(251, 192, 45, 0.3)',
                borderColor: '#fbc02d',
                pointBackgroundColor: '#f9a825',
                pointBorderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: '#9e9e9e' },
                    grid: { color: '#eee' },
                    pointLabels: {
                        color: '#5d4037',
                        font: { size: 13, weight: 'bold' }
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
