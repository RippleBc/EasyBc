/********************************************* 初始化mysql *********************************************/

# login
mysql -uroot

#
use mysql

# 修改mysql root密码
ALTER user 'root'@'localhost' IDENTIFIED BY 'root';

#修改mysql root的访问权限，支持远程访问
update user set host = '%' where user = 'root';

# 创建数据库
CREATE DATABASE consensus

/********************************************* 开启外网访问 *********************************************/

#
sudo vim /etc/mysql/my.cnf

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
mysql -uroot -proot

# 检查event_scheduler是否为ON
show variables like '%sc%';

#
use consensus;

# 每个几秒钟定时删除表中过期的数据
DROP EVENT IF EXISTS e_delete_perishHashes;
CREATE EVENT e_delete_perishHashes
ON SCHEDULE
EVERY 2 MINUTE
DO
DELETE FROM perishHashes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 MINUTE);

DROP EVENT IF EXISTS e_delete_abnormalNodes;
CREATE EVENT e_delete_abnormalNodes
ON SCHEDULE
EVERY 1 HOUR
DO
DELETE FROM abnormalNodes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR);

DROP EVENT IF EXISTS e_delete_timeConsumes;
CREATE EVENT e_delete_timeConsumes
ON SCHEDULE
EVERY 1 HOUR
DO
DELETE FROM timeConsumes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR);

DROP EVENT IF EXISTS e_delete_logs;
CREATE EVENT e_delete_logs
ON SCHEDULE
EVERY 1 DAY
DO
DELETE FROM logs WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY);

#
show events;

/********************************************* 清除节点信息 *********************************************/

#
mysql -uroot -proot

#
DROP DATABASE consensus

#
CREATE DATABASE consensus
