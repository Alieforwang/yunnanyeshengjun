document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('historyTableBody');
    const dateFilter = document.getElementById('dateFilter');
    const typeFilter = document.getElementById('typeFilter');
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const detailModal = document.getElementById('detailModal');
    const detailContent = document.getElementById('detailContent');
    let currentPage = 1;
    let totalPages = 1;

    function fetchHistory() {
        const days = dateFilter.value;
        const type = typeFilter.value;
        fetch(`/api/history?days=${days}&type=${type}&page=${currentPage}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    renderTable(data.data);
                    totalPages = data.pages;
                    pageInfo.textContent = `第 ${currentPage} 页`;
                } else {
                    tableBody.innerHTML = '<tr><td colspan="6">暂无数据</td></tr>';
                }
            });
    }

    function renderTable(records) {
        if (!records || records.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">暂无数据</td></tr>';
            return;
        }
        tableBody.innerHTML = '';
        records.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.detect_time || ''}</td>
                <td>${record.mushroom_type || ''}</td>
                <td>${record.location || ''}</td>
                <td>${record.confidence !== null ? (record.confidence * 100).toFixed(2) + '%' : ''}</td>
                <td>${record.danger_tip || ''}</td>
                <td><button class="btn btn-primary btn-detail">详情</button></td>
            `;
            tr.querySelector('.btn-detail').onclick = function() {
                showDetail(record);
            };
            tableBody.appendChild(tr);
        });
    }

    function showDetail(record) {
        detailContent.innerHTML = `
            <div style="display: flex; gap: 24px; align-items: flex-start; justify-content: center; margin-bottom: 18px;">
                <div style="text-align:center;">
                    <div style='font-weight:bold;margin-bottom:6px;'>原始图片</div>
                    <img src='${record.file_path || ''}' class='result-img' alt='原始图片' style='max-width:180px;max-height:180px;border-radius:10px;box-shadow:0 2px 8px rgba(60,60,60,0.10);background:#f9fbe7;'>
                </div>
                <div style="text-align:center;">
                    <div style='font-weight:bold;margin-bottom:6px;'>分析结果</div>
                    <img src='${record.result_path || ''}' class='result-img' alt='分析结果' style='max-width:180px;max-height:180px;border-radius:10px;box-shadow:0 2px 8px rgba(60,60,60,0.10);background:#f9fbe7;'>
                </div>
            </div>
            <div class='result-mushroom'>${record.mushroom_type || ''}</div>
            <div class='result-confidence'>置信度：${record.confidence !== null ? (record.confidence * 100).toFixed(2) + '%' : ''}</div>
            <div class='danger-tip'>${record.danger_tip || ''}</div>
            <div class='result-time'>识别时间：${record.detect_time || ''}</div>
        `;
        detailModal.style.display = 'block';
    }

    // 关闭弹窗
    document.querySelector('.close-btn').onclick = function() {
        detailModal.style.display = 'none';
    };
    window.onclick = function(event) {
        if (event.target === detailModal) {
            detailModal.style.display = 'none';
        }
    };

    prevPage.onclick = function() {
        if (currentPage > 1) {
            currentPage--;
            fetchHistory();
        }
    };
    nextPage.onclick = function() {
        if (currentPage < totalPages) {
            currentPage++;
            fetchHistory();
        }
    };
    dateFilter.onchange = typeFilter.onchange = function() {
        currentPage = 1;
        fetchHistory();
    };

    // 首次加载
    fetchHistory();
});