/********************************************* 初始化mongo *********************************************/

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

# create account
db.createUser({
  user: "blockChain", 
  pwd: "blockChain", roles: [{
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
vim /etc/mongod.conf

# network interfaces
net:
  port: 4406
  bindIp: 0.0.0.0

# enable authorization
security:
  authorization: "enabled"

# restart mongod
sudo service mongod restart

/********************************************* 清除节点信息 *********************************************/

# login
mongo --port 4406 -u "root" -p "root" --authenticationDatabase "admin"

#
use blockChain

#
db.blocks.remove({})

#
db.trienodes.remove({})