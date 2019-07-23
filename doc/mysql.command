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

# 每10秒钟定时删除表中过期的数据
DROP EVENT IF EXISTS e_delete_counterHashes;
CREATE EVENT e_delete_counterHashes
ON SCHEDULE
EVERY 10 SECOND
DO
DELETE FROM counterHashes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 MINUTE);

DROP EVENT IF EXISTS e_delete_perishHashes;
CREATE EVENT e_delete_perishHashes
ON SCHEDULE
EVERY 10 SECOND
DO
DELETE FROM perishHashes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 MINUTE);

DROP EVENT IF EXISTS e_delete_abnormalNodes;
CREATE EVENT e_delete_abnormalNodes
ON SCHEDULE
EVERY 10 SECOND
DO
DELETE FROM abnormalNodes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR);

DROP EVENT IF EXISTS e_delete_timeConsumes;
CREATE EVENT e_delete_timeConsumes
ON SCHEDULE
EVERY 10 SECOND
DO
DELETE FROM timeConsumes WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR);

DROP EVENT IF EXISTS e_delete_logs;
CREATE EVENT e_delete_logs
ON SCHEDULE
EVERY 10 SECOND
DO
DELETE FROM logs WHERE createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY);

#
show events;

#
SELECT count(*) FROM counterHashes;