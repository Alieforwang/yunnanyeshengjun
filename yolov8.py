from ultralytics import YOLO
import cv2
import os
import numpy as np
import time

def predict_image(model_path, file_path):
    """
    使用指定的模型对图片进行推理并保存标注结果
    :param model_path: 模型权重路径
    :param file_path: 输入图片路径
    :return: 推理结果对象, result_image_path
    """
    # 加载模型
    model = YOLO(model_path)
    # 推理
    results = model.predict(source=file_path, save=False, conf=0.25)[0]
    # 绘制标注
    annotated_image = results.plot()
    # 兼容PIL和numpy
    if not isinstance(annotated_image, np.ndarray):
        annotated_image = np.array(annotated_image)
    # BGR格式保存
    if annotated_image.shape[2] == 3:
        # 可能是RGB，需转BGR
        annotated_image = cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR)
    # 生成唯一文件名
    ts = int(time.time() * 1000)
    result_filename = f"results_{ts}.jpg"
    output_path = os.path.join('static', result_filename)
    os.makedirs('static', exist_ok=True)
    cv2.imwrite(output_path, annotated_image)
    return results, output_path 