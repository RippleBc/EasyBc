/********************************************* 初始化mysql *********************************************/

# 修改配置文件，免密登录
sudo vim /etc/mysql/my.cnf

#
[mysqld]
skip-grant-tables

# 重启服务
sudo service mysql restart

# login
mysql -uroot -p

# 刷新权限
flush privileges;

#
use mysql

# 修改登录模式，传统的密码登录模式
UPDATE user SET plugin='mysql_native_password' where user='root';

# 修改mysql root密码，这里注意密码必须包含大小写字母，数字以及特殊符号
ALTER user 'root'@'localhost' IDENTIFIED BY 'Walker!@#$%12345';

# 修改mysql root的访问权限，支持远程访问
update user set host = '%' where user = 'root';

# 创建数据库
CREATE DATABASE consensus;

/********************************************* 开启外网访问 *********************************************/

#
sudo vim /etc/mysql/my.cnf

# 删除
[mysqld]
skip-grant-tables

#
[mysqld]
bind-address=0.0.0.0

#
sudo service mysql restart

/********************************************* 定时清理表中过期的数据 *********************************************/

#
sudo vim /etc/mysql/my.cnf

#
[mysqld]
event_scheduler=ON

#
sudo service mysql restart

#
mysql -uroot -p

# 检查event_scheduler是否为ON
show variables like '%sc%';

#
use consensus;

# 每天凌晨3点删除表中过期的数据
DROP EVENT IF EXISTS e_delete_perishHashes;
CREATE EVENT e_delete_perishHashes
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE(ADDDATE(CURDATE(), 1)), INTERVAL 3 HOUR)
DO
DELETE FROM perishHashes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY);

DROP EVENT IF EXISTS e_delete_abnormalNodes;
CREATE EVENT e_delete_abnormalNodes
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE(ADDDATE(CURDATE(), 1)), INTERVAL 3 HOUR)
DO
DELETE FROM abnormalNodes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY);

DROP EVENT IF EXISTS e_delete_timeConsumes;
CREATE EVENT e_delete_timeConsumes
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE(ADDDATE(CURDATE(), 1)), INTERVAL 3 HOUR)
DO
DELETE FROM timeConsumes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY);

DROP EVENT IF EXISTS e_delete_logs;
CREATE EVENT e_delete_logs
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE(ADDDATE(CURDATE(), 1)), INTERVAL 3 HOUR)
DO
DELETE FROM logs WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY);

#
show events;

/********************************************* 清除节点信息 *********************************************/

#
mysql -uroot -proot

#
DROP DATABASE consensus;

#
CREATE DATABASE consensus;

/********************************************* 初始化transaction服务的节点列表 *********************************************/
#
mysql -uroot -proot

#
use transaction

#
INSERT INTO `transaction`.`nodes`
(`name`, `address`, `host`, `port`, `remarks`, `createdAt`, `updatedAt`)
VALUES
("http://localhost:8081", "5a8fbde736795f7ef2ebff7cda09d8133da34d0b", "http://localhost", "8081", "http://localhost:8081", "2019-06-27 02:09:02", "2019-06-27 02:09:02"),
("http://localhost:8181", "68ecab823675efa71e2edbe26a56b7a0d765dcde", "http://localhost", "8181", "http://localhost:8181", "2019-07-05 05:53:49", "2019-11-25 06:43:13"),
("http://localhost:8281", "a20e4e1f76c64d8ba70237df08e15dfeb4c5f0f1", "http://localhost", "8281", "http://localhost:8281", "2019-07-18 08:10:00", "2019-11-25 06:42:36"),
("http://localhost:8381", "059f8dc90879230fa7d51b6177b91d75c12bde4e", "http://localhost", "8381", "http://localhost:8381", "2019-11-25 06:43:35", "2019-11-25 06:43:35");
