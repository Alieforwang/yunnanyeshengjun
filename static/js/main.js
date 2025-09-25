document.addEventListener('DOMContentLoaded', function() {
    // 文件上传与预览
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('previewArea');
    const uploadHint = document.querySelector('.upload-hint');
    const resultArea = document.getElementById('resultArea');

    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    });
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                displayImage(file);
                uploadAndDetect(file);
            } else if (file.type.startsWith('video/')) {
                displayVideo(file);
            }
        });
    }

    function displayImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewArea.innerHTML = '';
            if (uploadHint) uploadHint.style.opacity = '0';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-item';
            img.alt = '原始图片';
            img.onclick = function() {
                previewArea.innerHTML = '';
                if (uploadHint) uploadHint.style.opacity = '1';
            };
            previewArea.appendChild(img);
        };
        reader.readAsDataURL(file);
    }

    function uploadAndDetect(file) {
        const formData = new FormData();
        formData.append('file', file);
        fetch('/api/detect', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showResult(data);
            } else {
                alert(data.message || '识别失败');
            }
        });
    }

    function showResult(data) {
        resultArea.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-mushroom">菌类：${data.mushroom_type}</div>
            <div class="result-confidence">置信度：${(data.confidence * 100).toFixed(2)}%</div>
            <div class="danger-tip">${data.danger_tip || ''}</div>
            <div class="result-time">识别时间：${data.detect_time || ''}</div>
        `;
        const resultImg = document.createElement('img');
        resultImg.src = data.result_image + '?t=' + Date.now();
        resultImg.className = 'result-img';
        resultImg.alt = '识别结果';
        resultImg.onerror = function() {
            this.alt = '标注图片加载失败';
            this.style.display = 'none';
        };
        card.appendChild(resultImg);
        resultArea.appendChild(card);
    }

    function displayVideo(file) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.className = 'preview-item';
        video.controls = true;
        previewArea.appendChild(video);
    }

    // 初始化图表
    initCharts();

    // 图表初始化函数
    function initCharts() {
        const timeChart = echarts.init(document.getElementById('timeChart'));
        const typeChart = echarts.init(document.getElementById('typeChart'));

        // 时间段分布折线图
        timeChart.setOption({
            title: { text: '时间段分布' },
            tooltip: { trigger: 'axis', formatter: '{b}: {c}次' },
            xAxis: { 
                data: ['6-9时', '9-12时', '12-15时', '15-18时', '18-21时'],
                axisLine: { lineStyle: { color: '#666' } }
            },
            yAxis: { axisLine: { lineStyle: { color: '#666' } } },
            series: [{
                type: 'line',
                data: [5, 20, 36, 10, 10],
                smooth: true,
                lineStyle: { width: 2, color: '#1890ff' },
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: { color: '#1890ff' },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}次',
                    fontSize: 12,
                    color: '#666'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(24,144,255,0.3)' },
                            { offset: 1, color: 'rgba(24,144,255,0.1)' }
                        ]
                    }
                }
            }]
        });

        // 假数据渲染菌类分布柱形图
        const names = ['奶浆菌','干巴菌','松茸','松露','牛肝菌','珊瑚菌','竹荪','羊肚菌','见手青','青头菌','鸡枞菌','鸡油菌'];
        const counts = [5, 2, 8, 1, 6, 3, 4, 7, 0, 2, 9, 1];
        typeChart.setOption({
            title: { text: '菌类分布' },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    const d = params[0];
                    return `${d.name}: ${d.value}次`;
                }
            },
            xAxis: {
                type: 'category',
                data: names,
                axisLabel: { rotate: 30, color: '#5d7a3a', fontWeight: 'bold', fontSize: 13 },
                axisLine: { lineStyle: { color: '#7c5c36' } }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#7c5c36' } },
                splitLine: { lineStyle: { color: '#eee' } }
            },
            series: [{
                type: 'bar',
                data: counts,
                barWidth: '50%',
                itemStyle: { color: '#7cb342', borderRadius: [6, 6, 0, 0] },
                label: {
                    show: true,
                    position: 'top',
                    color: '#5d7a3a',
                    fontWeight: 'bold',
                    fontSize: 12,
                    formatter: '{c}次'
                }
            }]
        });

        // 自适应
        window.addEventListener('resize', function() {
            timeChart.resize();
            typeChart.resize();
        });
    }
});