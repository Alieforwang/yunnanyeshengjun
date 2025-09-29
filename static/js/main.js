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

        // 刷新所有统计数据
        refreshAllStats();
    }

    // 刷新图表数据
    function refreshCharts() {
        const typeChartElement = document.getElementById('typeChart');
        if (typeChartElement) {
            const typeChart = echarts.getInstanceByDom(typeChartElement);
            if (typeChart) {
                loadMushroomStats(typeChart);
            }
        }
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

    // 加载统计概览数据
    loadOverviewStats();

    // 图表初始化函数
    function initCharts() {
        const typeChartElement = document.getElementById('typeChart');
        if (!typeChartElement) {
            console.error('未找到typeChart元素');
            return;
        }

        const typeChart = echarts.init(typeChartElement);

        // 加载菌类分布数据
        loadMushroomStats(typeChart);

        // 自适应
        window.addEventListener('resize', function() {
            typeChart.resize();
        });
    }

    // 加载菌类统计数据
    function loadMushroomStats(chart) {
        fetch('/api/stats/classes')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const names = data.data.map(item => item.name);
                    const counts = data.data.map(item => item.count);

                    chart.setOption({
                        title: {
                            text: '菌类分布',
                            textStyle: {
                                color: '#5d7a3a',
                                fontSize: 16,
                                fontWeight: 'bold'
                            }
                        },
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
                            axisLabel: {
                                rotate: 30,
                                color: '#5d7a3a',
                                fontWeight: 'bold',
                                fontSize: 11
                            },
                            axisLine: { lineStyle: { color: '#7c5c36' } }
                        },
                        yAxis: {
                            type: 'value',
                            axisLine: { lineStyle: { color: '#7c5c36' } },
                            axisLabel: { color: '#5d7a3a' },
                            splitLine: { lineStyle: { color: '#eee' } }
                        },
                        series: [{
                            type: 'bar',
                            data: counts,
                            barWidth: '50%',
                            itemStyle: {
                                color: '#7cb342',
                                borderRadius: [6, 6, 0, 0]
                            },
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
                } else {
                    console.error('加载菌类统计数据失败:', data.message);
                    // 显示默认数据
                    showDefaultChart(chart);
                }
            })
            .catch(error => {
                console.error('获取菌类统计数据出错:', error);
                // 显示默认数据
                showDefaultChart(chart);
            });
    }

    // 显示默认图表数据
    function showDefaultChart(chart) {
        const names = ['奶浆菌','干巴菌','松茸','松露','牛肝菌','珊瑚菌','竹荪','羊肚菌','见手青','青头菌','鸡枞菌','鸡油菌'];
        const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        chart.setOption({
            title: {
                text: '菌类分布',
                textStyle: {
                    color: '#5d7a3a',
                    fontSize: 16,
                    fontWeight: 'bold'
                }
            },
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
                axisLabel: {
                    rotate: 30,
                    color: '#5d7a3a',
                    fontWeight: 'bold',
                    fontSize: 11
                },
                axisLine: { lineStyle: { color: '#7c5c36' } }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#7c5c36' } },
                axisLabel: { color: '#5d7a3a' },
                splitLine: { lineStyle: { color: '#eee' } }
            },
            series: [{
                type: 'bar',
                data: counts,
                barWidth: '50%',
                itemStyle: {
                    color: '#7cb342',
                    borderRadius: [6, 6, 0, 0]
                },
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
    }

    // 加载统计概览数据
    function loadOverviewStats() {
        fetch('/api/stats/overview')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 更新今日识别数
                    const todayCountElement = document.getElementById('todayCount');
                    if (todayCountElement) {
                        todayCountElement.textContent = data.data.today_count;
                    }

                    // 更新总识别数
                    const totalCountElement = document.getElementById('totalCount');
                    if (totalCountElement) {
                        totalCountElement.textContent = data.data.total_count;
                    }
                } else {
                    console.error('加载统计概览失败:', data.message);
                }
            })
            .catch(error => {
                console.error('获取统计概览出错:', error);
            });
    }

    // 刷新所有统计数据
    function refreshAllStats() {
        loadOverviewStats();
        refreshCharts();
    }
});