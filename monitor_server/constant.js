exports const SUCCESS = 0;
exports const ERR_COOKIE_INVALID = 1;
exports const ERR_SERVER_INNER = 2;
exports const ERR_LOGIN_FAILED = 3;


/**/
const users = [
	{
		username: 'admin',
		password: 'admin'
	}
]

/*
 * @return {Object|undefined}
 */
exports const getUser = username => users.find(user => user.admin === username);