# 云南野生菌识别系统

## 项目简介

云南野生菌识别系统是一个基于深度学习的Web应用，专门用于识别云南地区常见的野生菌类。系统采用YOLOv8目标检测模型，能够准确识别12种常见的云南野生菌，并提供详细的识别结果和历史记录管理功能。

## 功能特性

### 🍄 野生菌识别
- 支持12种云南常见野生菌识别：
  - 奶浆菌、干巴菌、松茸、松露
  - 牛肝菌、珊瑚菌、竹荪、羊肚菌
  - 见手青、青头菌、鸡枞菌、鸡油菌

### 📸 图像处理
- 支持多种图片格式上传（JPG、PNG、WEBP等）
- 实时图像预处理和标注
- 高精度目标检测和分类

### 📊 数据管理
- 识别历史记录存储
- 按时间范围筛选历史记录
- 按菌类类型筛选
- 分页显示和统计分析

### 🎨 用户界面
- 现代化响应式Web界面
- 直观的拖拽上传功能
- 实时识别结果展示
- 历史记录可视化

## 技术栈

### 后端技术
- **Flask** - Python Web框架
- **YOLOv8** - 目标检测模型
- **OpenCV** - 图像处理
- **MySQL** - 数据库存储

### 前端技术
- **HTML5/CSS3** - 页面结构和样式
- **JavaScript** - 交互逻辑
- **Bootstrap** - 响应式布局

### AI模型
- **Ultralytics YOLOv8** - 深度学习框架
- **自训练模型** - 专门针对云南野生菌优化

## 项目结构

```
yunnanyeshengjun/
├── app.py                 # Flask主应用
├── yolov8.py             # YOLOv8模型推理模块
├── requirements.txt       # Python依赖包
├── classes.txt           # 菌类标签文件
├── models/               # 模型文件目录
├── weights/              # 训练权重文件
│   ├── best.pt          # 最佳模型权重
│   └── last.pt          # 最新模型权重
├── static/               # 静态资源
│   ├── css/             # 样式文件
│   ├── js/              # JavaScript文件
│   ├── uploads/         # 上传图片目录
│   └── zit/             # 字体文件
├── templates/            # HTML模板
│   ├── index.html       # 主页面
│   └── history.html     # 历史记录页面
├── util/                 # 工具模块
│   └── DBUtil.py        # 数据库操作类
└── sql/                  # 数据库脚本
    └── yunnanyeshengjun.sql
```

## 安装指南

### 环境要求
- Python 3.8+
- MySQL 5.7+
- 至少4GB内存（推荐8GB）

### 1. 克隆项目
```bash
git clone https://github.com/Alieforwang/yunnanyeshengjun.git
cd yunnanyeshengjun
```

### 2. 安装Python依赖
```bash
pip install -r requirements.txt
```

### 3. 数据库配置
1. 创建MySQL数据库：
```sql
CREATE DATABASE yunnanyeshengjun CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库结构：
```bash
mysql -u root -p yunnanyeshengjun < sql/yunnanyeshengjun.sql
```

3. 修改数据库连接配置（如需要）：
编辑 `util/DBUtil.py` 中的数据库连接参数：
```python
def __init__(self, host='localhost', user='root', password='123456', database='yunnanyeshengjun'):
```

### 4. 模型文件
确保 `weights/` 目录下有训练好的模型文件：
- `best.pt` - 最佳性能模型
- `last.pt` - 最新训练模型

## 使用说明

### 启动应用
```bash
python app.py
```

应用将在 `http://localhost:8888` 启动

### 使用流程
1. **上传图片**：在主页面拖拽或点击上传野生菌图片
2. **AI识别**：系统自动使用YOLOv8模型进行识别
3. **查看结果**：显示识别到的菌类名称、置信度和标注图片
4. **历史记录**：在历史页面查看所有识别记录
5. **数据筛选**：按时间范围和菌类类型筛选历史数据

### API接口

#### 野生菌识别
```
POST /api/detect
Content-Type: multipart/form-data

参数：
- file: 图片文件

返回：
{
    "success": true,
    "results": [
        {
            "class": "松茸",
            "confidence": 0.95,
            "bbox": [x1, y1, x2, y2]
        }
    ],
    "result_image": "/static/results_xxx.jpg"
}
```

#### 获取历史记录
```
GET /api/history?days=7&type=all&page=1&page_size=8

返回：
{
    "success": true,
    "data": [...],
    "total": 100,
    "page": 1,
    "page_size": 8
}
```

## 开发说明

### 模型训练
如需重新训练模型，请参考YOLOv8官方文档：
1. 准备标注数据集
2. 配置训练参数
3. 执行训练脚本
4. 评估模型性能

### 数据库扩展
系统支持扩展更多菌类，只需：
1. 更新 `MUSHROOM_CLASSES` 列表
2. 重新训练包含新类别的模型
3. 更新 `classes.txt` 文件

### 部署建议
- 使用Gunicorn或uWSGI作为WSGI服务器
- 配置Nginx作为反向代理
- 使用Docker容器化部署
- 配置SSL证书启用HTTPS

## 贡献指南

欢迎提交Issue和Pull Request来改进项目：

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目维护者：Alieforwang
- 项目地址：https://github.com/Alieforwang/yunnanyeshengjun
- 问题反馈：通过GitHub Issues提交

## 致谢

- 感谢Ultralytics团队提供的YOLOv8框架
- 感谢云南农业大学提供的野生菌数据支持
- 感谢所有为项目贡献代码和建议的开发者

---

**注意**：本系统仅用于学习和研究目的，野生菌识别结果仅供参考，实际食用前请咨询专业人士。