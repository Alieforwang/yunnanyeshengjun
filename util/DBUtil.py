import mysql.connector
from mysql.connector import Error

class DatabaseManager():
    def __init__(self, host='localhost', user='root', password='123456', database='yunnanyeshengjun'):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None

    def connect(self):
        try:
            if self.connection and self.connection.is_connected():
                return
                
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            if self.connection.is_connected():
                print(f"成功连接到数据库 {self.database}")
        except Error as e:
            print(f"数据库连接错误: {e}")
            raise Exception(f"数据库连接失败: {str(e)}")

    def disconnect(self):
        try:
            if self.connection and self.connection.is_connected():
                self.connection.close()
                print("数据库连接已关闭")
        except Error as e:
            print(f"关闭数据库连接错误: {e}")

    def query_data(self, query, params=None):
        if not self.connection or not self.connection.is_connected():
            self.connect()
            
        cursor = self.connection.cursor()
        try:
            cursor.execute(query, params)
            result = cursor.fetchall()
            return result
        except Error as e:
            print(f"查询执行错误: {e}")
            print(f"查询语句: {query}")
            print(f"参数: {params}")
            raise Exception(f"数据库查询失败: {str(e)}")
        finally:
            cursor.close()

    def update_data(self, query, params):
        if not self.connection or not self.connection.is_connected():
            self.connect()
            
        cursor = self.connection.cursor()
        try:
            cursor.execute(query, params)
            self.connection.commit()
            print("数据更新成功")
        except Error as e:
            print(f"更新执行错误: {e}")
            print(f"更新语句: {query}")
            print(f"参数: {params}")
            self.connection.rollback()
            raise Exception(f"数据库更新失败: {str(e)}")
        finally:
            cursor.close()

    def delete_data(self, query, params):
        if not self.connection or not self.connection.is_connected():
            self.connect()
            
        cursor = self.connection.cursor()
        try:
            cursor.execute(query, params)
            self.connection.commit()
            print("数据删除成功")
        except Error as e:
            print(f"删除执行错误: {e}")
            print(f"删除语句: {query}")
            print(f"参数: {params}")
            self.connection.rollback()
            raise Exception(f"数据库删除失败: {str(e)}")
        finally:
            cursor.close()
    
    def create_table(self,table_name):
        # 检查 user 表是否存在的 SQL 语句
        check_table_exists_query = """
        SELECT COUNT(*)
        FROM information_schema.tables 
        WHERE table_schema = %s AND table_name = %s;
        """
        params = (self.database, table_name)
        
        # 查询 user 表是否存在
        result = self.query_data(check_table_exists_query, params)
        
        if result and result[0][0] == 0:
            # 如果 user 表不存在，则创建 user 表的 SQL 语句
            create_table_query = """
            CREATE TABLE user (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL
            );
            """
            # 调用 update_data 函数来创建 user 表
            self.update_data(create_table_query, None)
        else:
            print("Table 'user' already exists")

    def create_tables(self):
        try:
            cursor = self.connection.cursor()
            
            # 创建用户表
            create_users_table = """
            CREATE TABLE IF NOT EXISTS user (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            # 创建分析记录表
            create_analysis_records_table = """
            CREATE TABLE IF NOT EXISTS analysis_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                result_path VARCHAR(255) NOT NULL,
                detect_type VARCHAR(100),
                location VARCHAR(255),
                confidence FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user(id)
            );
            """
            
            # 创建统计数据表
            create_stats_table = """
            CREATE TABLE IF NOT EXISTS detection_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                detection_date DATE NOT NULL,
                daily_count INT DEFAULT 0,
                total_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user(id),
                UNIQUE KEY unique_user_date (user_id, detection_date)
            );
            """
            
            # 执行创建表的操作
            cursor.execute(create_users_table)
            cursor.execute(create_analysis_records_table)
            cursor.execute(create_stats_table)
            
            # 添加索引
            try:
                cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_analysis_user_time 
                ON analysis_records (user_id, created_at DESC)
                """)
            except Exception as e:
                print(f"创建分析记录索引提示: {str(e)}")
                
            try:
                cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_stats_user_date 
                ON detection_stats (user_id, detection_date DESC)
                """)
            except Exception as e:
                print(f"创建统计数据索引提示: {str(e)}")
            
            # 提交事务
            self.connection.commit()
            print("数据库表和索引创建成功")
            
        except Error as e:
            print(f"创建数据库表错误: {e}")
            self.connection.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()