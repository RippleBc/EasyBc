/********************************************* 初始化mongo *********************************************/

#
sudo service mongod start

# login
mongo

# 选择admin数据库
use admin

# create root user
db.createUser({
	user: "root",
	pwd: "root",
	roles: [{
		role: "userAdminAnyDatabase",
		db: "admin"
	}]
})

# login as root 
db.auth("root", "root")

# grant 副本集权限 to root
db.grantRolesToUser(
	"root",
  [ 
		{ 
			"role" : "clusterAdmin", 
			"db" : "admin" 
		} 	
	]
)

# create account
db.createUser({
  user: "blockChain", 
  pwd: "blockChain", 
	roles: [{
    role:"readWrite", 
    db:"blockChain"
  }]
})

# grant role to user
db.grantRolesToUser(
	"blockChain",
	[
		{
			role: "readWrite",
			db: "blockChain"
		}
	]
)

/********************************************* 开启外网访问 *********************************************/

#
sudo vim /etc/mongod.conf

# network interfaces
net:
  port: 4406
  bindIp: 0.0.0.0

# enable authorization
security:
  authorization: "enabled"

# restart mongod
sudo service mongod restart

/********************************************* 设置副本集 *********************************************/

# 主服务器配置
security:
	keyFile: /home/yingqiyu/mongoKeyFile

replication:
  replSetName: "EasyBc"

/********************************************* 配置副本集(将一个独立的已经在使用的mongo实例转化为replicateSet) *********************************************/

# login
mongo --port 4406 -u "root" -p "root" --authenticationDatabase "admin"

# 初始化
rs.initiate()

# 定义主节点host
var conf = rs.conf();

conf.members[0].host="localhost:4406"；

rs.reconfig(conf)

# 添加备份节点
rs.add({
	_id: 1,
	host: "localhost:4407",
	priority: 0,
	hidden: true
});

# 添加仲裁节点
rs.add({
	_id: 2,
	host: "localhost:4408",
	priority: 0,
	hidden: true,
	arbiterOnly: true
})

/********************************************* 配置副本集(初始化全新的副本集) *********************************************/

rs.initiate(
  {
    _id: "EasyBC",
    members: [
      { _id: 0, host: "mongo1.example.net:4406" },
      { _id: 1, host: "mongo2.example.net:4406" },
      { _id: 2, host: "mongo3.example.net:4406" }
    ]
  }
)

/********************************************* 清除节点信息 *********************************************/

# login
mongo --port 4406 -u "blockChain" -p "blockChain" --authenticationDatabase "admin"

#
use blockChain

#
db.blocks.remove({})

#
db.trienodes.remove({})

/********************************************* 备份mongo *********************************************/

mongodump --port 4406 -u "blockChain" -p "blockChain" --authenticationDatabase "admin" -d [blockChain] -o ./mongoBackup


mongorestore --port 4406 -u "blockChain" -p "blockChain" --authenticationDatabase "admin" -d [blockChain] ./mongoBackup/[blockChain]

/********************************************* 批量部署节点 *********************************************/
# login
mongo --port 4406 -u "blockChain" -p "blockChain" --authenticationDatabase "admin"

#
use blockChain

#
unls.insert({
	"address": "",
	"host": "",
	"queryPort": ,
	"p2pPort": ,
	"state": ,
	"index": 
}, {
	"address": "",
	"host": "",
	"queryPort": ,
	"p2pPort": ,
	"state": ,
	"index": 
});

# example
db.unls.insert([
	{
		"address": "78ecab823675efa71e2edbe26a56b7a0d765dcde",
		"host": "localhost",
		"queryPort": 8181,
		"p2pPort": 9190,
		"state": 0,
		"index": 1
	}, 
	{
		"address": "b20e4e1f76c64d8ba70237df08e15dfeb4c5f0f1",
		"host": "localhost",
		"queryPort": 8281,
		"p2pPort": 9190,
		"state": 0,
		"index": 2
	}
]);

/********************************************* 创建超级帐号 *********************************************/
# login
mongo --port 4406 -u "admin" -p "admin" --authenticationDatabase "admin"

#
db.createRole({
	role:'sysadmin',
	roles:[],
	privileges:[
		{
			resource:{
				anyResource:true
			},
			actions:['anyAction']}
	]
})

#
db.createUser({
	user:'supreme',
	pwd:'supreme',
	roles:[
		{
			role:'sysadmin',
			db:'admin'
		}
	]
})

#
mongo --port 4406 -u "supreme" -p "supreme" --authenticationDatabase "admin"