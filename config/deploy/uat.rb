set :deploy_to, '/home/deployer/parse'
set :user, 'deployer'
set :pid_file_name, 'parse.pid'
set :branch, 'uat'
set :url_ping, 'https://notif-uat.citylity.com/parse'
role :app, %w{deployer@185.8.50.64}
