from flask import Flask, session, jsonify, redirect, url_for, request, render_template
import util.DBUtil as DBM
from datetime import timedelta, datetime
import os
from yolov8 import predict_image  # 确保有此推理函数

app = Flask(__name__)
app.secret_key = '123456'  # 设置session密钥

# 设置session的配置
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # session有效期7天
app.config['SESSION_COOKIE_SECURE'] = False  # 如果不是HTTPS可以设为False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# 确保必需的目录存在
def ensure_directories():
    directories = [
        'static',
        'static/uploads',
        'models'
    ]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

# 在应用启动时创建目录
ensure_directories()

MUSHROOM_CLASSES = [
    '奶浆菌', '干巴菌', '松茸', '松露', '牛肝菌', '珊瑚菌',
    '竹荪', '羊肚菌', '见手青', '青头菌', '鸡枞菌', '鸡油菌'
]

@app.route('/') 
def home():
    return render_template('index.html')

@app.route('/history')
def history():
    return render_template('history.html')

# 获取野生菌识别历史记录的接口
@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        days = request.args.get('days', '7')
        type_filter = request.args.get('type', 'all')
        page = int(request.args.get('page', '1'))
        per_page = int(request.args.get('page_size', '8'))  # 从请求参数中获取page_size，默认为8
        db = DBM.DatabaseManager()
        db.connect()
        # 构建查询条件
        conditions = []
        params = []
        if days != 'all':
            conditions.append('created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)')
            params.append(days)
        if type_filter != 'all':
            conditions.append('mushroom_type = %s')
            # 菌类类型映射
            type_mapping = {
                'songrong': '松茸',
                'jizong': '鸡枞',
                'niugan': '牛肝菌'
            }
            params.append(type_mapping.get(type_filter, type_filter))
        where_clause = ' AND '.join(conditions) if conditions else '1=1'
        count_query = f'SELECT COUNT(*) FROM analysis_records WHERE {where_clause}'
        total_result = db.query_data(count_query, tuple(params))
        total_records = total_result[0][0] if total_result else 0
        offset = (page - 1) * per_page
        query = f'''
            SELECT * FROM analysis_records 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        '''
        records_result = db.query_data(query, tuple(params + [per_page, offset]))
        records = []
        if records_result:
            for row in records_result:
                file_path = row[3]
                result_path = row[4]
                if not file_path.startswith('/static/'):
                    file_path = f'/static/uploads/{os.path.basename(file_path)}'
                if not result_path.startswith('/static/'):
                    result_path = f'/static/{result_path}'
                records.append({
                    'id': row[0],
                    'detect_time': row[8].strftime('%Y-%m-%d %H:%M:%S'),
                    'mushroom_type': row[5] or '未知',
                    'location': row[6] or '未指定',
                    'confidence': float(row[7]) if row[7] else None,
                    'file_path': file_path,
                    'result_path': result_path,
                    'file_type': row[2],
                    'danger_tip': row[9] if len(row) > 9 else ''
                })
        db.disconnect()
        return jsonify({
            'success': True,
            'data': records,
            'total': total_records,
            'pages': (total_records + per_page - 1) // per_page
        })
    except Exception as e:
        print(f"获取历史记录错误: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/detect', methods=['POST'])
def detect_mushroom():
    if 'file' not in request.files:
        print('没有文件')
        return jsonify({'success': False, 'message': '没有文件'}), 400
    file = request.files['file']
    if file.filename == '':
        print('未选择文件')
        return jsonify({'success': False, 'message': '未选择文件'}), 400
    upload_path = os.path.join('static/uploads', file.filename)
    print(f'保存上传图片到: {upload_path}')
    file.save(upload_path)
    model_path = os.path.join('weights', 'best.pt')
    print(f'准备调用模型: {model_path} 检测图片: {upload_path}')
    try:
        results, annotated_img = predict_image(model_path, upload_path)
        print('模型推理完成')
    except Exception as e:
        print('模型推理出错:', e)
        return jsonify({'success': False, 'message': f'模型推理出错: {e}'})
    # 解析结果
    if hasattr(results, 'boxes') and len(results.boxes) > 0:
        best_box = results.boxes[0]
        confidence = float(best_box.conf[0])
        cls = int(best_box.cls[0])
        # 用classes.txt顺序映射
        if 0 <= cls < len(MUSHROOM_CLASSES):
            class_name = MUSHROOM_CLASSES[cls]
        else:
            class_name = f'未知({cls})'
        print(f'检测到: {class_name}, 置信度: {confidence}')
        # 简单食用提示
        edible_list = ['松茸', '鸡枞', '牛肝菌', '竹荪', '羊肚菌', '鸡油菌']
        if class_name in edible_list:
            danger_tip = f'提示：该菌类可食用'
        elif class_name == '未识别':
            danger_tip = '提示：未识别出菌类'
        else:
            danger_tip = '提示：请谨慎辨别，部分野生菌有毒！'
    else:
        confidence = 0.0
        class_name = '未识别'
        print('未检测到任何目标')
        danger_tip = '提示：未识别出菌类'
    # 只存文件名或相对路径
    result_path_db = os.path.basename(annotated_img)
    result_image_url = '/static/' + result_path_db
    print(f'标注图片应保存为: {annotated_img}, 数据库存: {result_path_db}, 前端访问: {result_image_url}, 存在: {os.path.exists(annotated_img)}')
    detect_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    # 写入数据库
    try:
        db = DBM.DatabaseManager()
        db.connect()
        user_id = 1
        file_type = file.content_type if hasattr(file, 'content_type') else 'image'
        db.update_data(
            "INSERT INTO analysis_records (user_id, file_type, file_path, result_path, detect_type, mushroom_type, location, confidence, created_at, danger_tip) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (user_id, file_type, upload_path, result_path_db, class_name, class_name, '', confidence, detect_time, danger_tip)
        )
        db.disconnect()
    except Exception as e:
        print(f"写入分析记录失败: {e}")
    return jsonify({
        'success': True,
        'mushroom_type': class_name,
        'confidence': confidence,
        'result_image': result_image_url,
        'danger_tip': danger_tip,
        'detect_time': detect_time
    })

@app.route('/api/stats/classes', methods=['GET'])
def stats_classes():
    try:
        # 使用内置的MUSHROOM_CLASSES，与检测函数保持一致
        class_list = MUSHROOM_CLASSES

        db = DBM.DatabaseManager()
        db.connect()

        # 尝试使用detect_type字段，如果没有数据则使用mushroom_type字段
        sql_detect_type = "SELECT detect_type, COUNT(*) FROM analysis_records WHERE detect_type IS NOT NULL GROUP BY detect_type"
        result = db.query_data(sql_detect_type)

        count_map = {}
        if result:
            for row in result:
                count_map[row[0]] = row[1]

        # 如果detect_type没有数据，尝试mushroom_type
        if not count_map:
            sql_mushroom_type = "SELECT mushroom_type, COUNT(*) FROM analysis_records WHERE mushroom_type IS NOT NULL GROUP BY mushroom_type"
            result = db.query_data(sql_mushroom_type)
            if result:
                for row in result:
                    count_map[row[0]] = row[1]

        db.disconnect()

        # 构建返回数据，确保所有菌类都有数据
        data = []
        for cname in class_list:
            data.append({"name": cname, "count": count_map.get(cname, 0)})

        print(f"菌类统计数据: {data}")  # 调试信息
        return jsonify({"success": True, "data": data})
    except Exception as e:
        print(f"获取菌类统计数据错误: {str(e)}")
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/stats/overview', methods=['GET'])
def stats_overview():
    try:
        db = DBM.DatabaseManager()
        db.connect()

        # 获取今日识别数
        today_sql = "SELECT COUNT(*) FROM analysis_records WHERE DATE(created_at) = CURDATE()"
        today_result = db.query_data(today_sql)
        today_count = today_result[0][0] if today_result else 0

        # 获取总识别数
        total_sql = "SELECT COUNT(*) FROM analysis_records"
        total_result = db.query_data(total_sql)
        total_count = total_result[0][0] if total_result else 0

        # 获取最新识别时间
        latest_sql = "SELECT MAX(created_at) FROM analysis_records"
        latest_result = db.query_data(latest_sql)
        latest_time = latest_result[0][0] if latest_result and latest_result[0][0] else None

        db.disconnect()

        return jsonify({
            "success": True,
            "data": {
                "today_count": today_count,
                "total_count": total_count,
                "latest_time": latest_time.strftime('%Y-%m-%d %H:%M:%S') if latest_time else None
            }
        })
    except Exception as e:
        print(f"获取统计概览错误: {str(e)}")
        return jsonify({"success": False, "message": str(e)})

if __name__ == '__main__':
    try:
        db = DBM.DatabaseManager()
        db.connect()
        print("数据库连接成功")
        db.create_tables()
        print("数据库表创建成功")
        result = db.query_data("SELECT COUNT(*) FROM user")
        if result and result[0][0] == 0:
            db.update_data(
                "INSERT INTO user (username, password) VALUES (%s, %s)",
                ("admin", "admin")
            )
            print("创建默认用户成功")
        db.disconnect()
        print("数据库初始化完成")
        app.run(debug=True, port=8888)
    except Exception as e:
        print(f"启动错误: {str(e)}")