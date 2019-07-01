// ssh and smtp
sudo ufw allow 22
sudo ufw allow 25

// mysql
sudo ufw allow 3306

// to 9090 consensus_full_server
sudo ufw allow from 123.157.68.241 to any port 9090
sudo ufw allow from 123.157.68.242 to any port 9090
sudo ufw allow from 123.157.68.243 to any port 9090
sudo ufw allow from 123.157.68.244 to any port 9090
sudo ufw allow from 123.157.68.245 to any port 9090
sudo ufw allow from 123.157.68.246 to any port 9090
sudo ufw allow from 218.205.124.17 to any port 9090
sudo ufw allow from 218.205.124.18 to any port 9090
sudo ufw allow from 183.131.134.241 to any port 9090
sudo ufw allow from 183.131.134.242 to any port 9090
sudo ufw allow from 115.233.227.46 to any port 9090

// to 8081 consensus_light_server
sudo ufw allow from 123.157.68.241 to any port 8081
sudo ufw allow from 123.157.68.242 to any port 8081
sudo ufw allow from 123.157.68.243 to any port 8081
sudo ufw allow from 123.157.68.244 to any port 8081
sudo ufw allow from 123.157.68.245 to any port 8081
sudo ufw allow from 123.157.68.246 to any port 8081
sudo ufw allow from 218.205.124.17 to any port 8081
sudo ufw allow from 218.205.124.18 to any port 8081
sudo ufw allow from 183.131.134.241 to any port 8081
sudo ufw allow from 183.131.134.242 to any port 8081


// to 8082, transaction_server
sudo ufw allow from 123.157.68.241 to any port 8082
sudo ufw allow from 123.157.68.242 to any port 8082
sudo ufw allow from 123.157.68.243 to any port 8082
sudo ufw allow from 123.157.68.244 to any port 8082
sudo ufw allow from 123.157.68.245 to any port 8082
sudo ufw allow from 123.157.68.246 to any port 8082
sudo ufw allow from 218.205.124.17 to any port 8082
sudo ufw allow from 218.205.124.18 to any port 8082
sudo ufw allow from 183.131.134.241 to any port 8082
sudo ufw allow from 183.131.134.242 to any port 8082

// open ufw
sudo ufw enable
sudo ufw default deny