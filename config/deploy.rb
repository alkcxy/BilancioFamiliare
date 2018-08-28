# config valid for current version and patch releases of Capistrano
lock "~> 3.11.0"

set :application, "BilancioFamiliare"
set :repo_url, "https://github.com/alkcxy/BilancioFamiliare.git"

# Default branch is :master
ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp

# Default deploy_to directory is /var/www/my_app_name
set :deploy_to, "/home/alessio/BF"

#set :deploy_tag, 'v1.1.0'

set :ssh_options, {
  auth_methods: ['publickey'],
  keys: ['~/.ssh/id_rsa'],
}

# Default value for :format is :airbrussh.
# set :format, :airbrussh

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: "log/capistrano.log", color: :auto, truncate: :auto

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
append :linked_files, "config/database.yml", "config/secrets.yml", "db/production.sqlite3", ".ruby-env", ".ruby-version", ".ruby-gemset"

# Default value for linked_dirs is []
append :linked_dirs, 'log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'vendor/bundle', 'public/system', 'public/uploads', 'public/assets', 'public/packs'

set :rvm_type, :user
set :rvm_custom_path, "/usr/share/rvm"                     # Defaults to: :auto
set :rvm_ruby_version, 'ruby-2.4.1@bf'      # Defaults to: 'default'

# Defaults to false
# Skip migration if files in db/migrate were not modified
set :conditionally_migrate, true

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for local_user is ENV['USER']
# set :local_user, -> { `git config user.name`.chomp }

# Default value for keep_releases is 5
set :keep_releases, 2
set :keep_assets, 2
# Uncomment the following to require manually verifying the host key before first deploy.
# set :ssh_options, verify_host_key: :secure

# config/deploy.rb
after 'deploy:updated', 'assets:precompile'

namespace :deploy do

  #desc 'Restart application'
  #task :restart do
  #  on roles(:app), in: :sequence, wait: 5 do
      # restart app:
  #    execute :touch, '/home/alessio/vassals/bf.ini'
  #  end
  #end

#  after :publishing, :restart


  # after :restart, :clear_cache do
  #   on roles(:web), in: :groups, limit: 3, wait: 10 do
  #     # Here we can do anything such as:
  #     # within release_path do
  #     #   execute :rake, 'cache:clear'
  #     # end
  #   end
  # end

    # It is important that we execute this after :normalize_assets because
  # ngx_http_gzip_static_module recommends that compressed and uncompressed
  # variants have the same mtime. Note that gzip(1) sets the mtime of the
  # compressed file after the original one automatically.
  # before :normalize_assets, :cleanup_assets
  # after :normalize_assets, :gzip_assets do
  #   on release_roles(fetch(:assets_roles)) do
  #     assets_path = release_path.join('public', fetch(:assets_prefix))
  #     within assets_path do
  #       execute :find, ". \\( -name '*.js' -o -name '*.css' \\) -exec test ! -e {}.gz \\; -print0 | xargs -r -P8 -0 gzip --keep --best --quiet"
  #     end
  #   end
  # end
end
