# config valid only for Capistrano 3
lock '3.4.0'

set :application, 'blokk'
set :repo_url, 'git@github.com:korny/blokk.git'

# use the same ruby as used locally for deployment
# set :rvm1_ruby_version, '2.1.0'

# Default branch is :master
set :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }

# Default deploy_to directory is /var/www/my_app
# set :deploy_to, '/var/www/my_app'

# Default value for :scm is :git
# set :scm, :git

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
set :log_level, :info

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
set :linked_files, %w{murfy.db}

# Default value for linked_dirs is []
set :linked_dirs, %w{bin log tmp/pids public/New_Zealand}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
set :keep_releases, 1

# use forward agent
# set :ssh_options, forward_agent: true

namespace :deploy do
  desc 'Restart application'
  task :restart do
    on roles(:app) do
      execute :touch, release_path.join('tmp/restart.txt')
    end
  end
  
  after :publishing, :restart
  
  after :finishing, "deploy:cleanup"
end
