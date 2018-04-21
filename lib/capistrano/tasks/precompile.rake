# lib/capistrano/tasks/precompile.rake
namespace :assets do
  desc 'Precompile assets locally and then rsync to web servers'
  task :precompile do
    run_locally do
      #set :rvm_type, :user
      #set :rvm_ruby_version, 'ruby-2.4.1@vagrant'
      with rails_env: "production" do
        execute "bin/rails", 'webpacker:compile'
      end
    end

    on roles(:web), in: :parallel do |server|
      run_locally do
        execute :rsync,
          "-a --delete ./public/packs/ #{server.hostname}:#{shared_path}/public/packs/"
        #execute :rsync,
        #  "-a --delete ./public/assets/ #{server.hostname}:#{shared_path}/public/assets/"
      end
    end

    # run_locally do
    #   execute :rm, '-rf public/assets'
    #   execute :rm, '-rf public/packs'
    # end
  end
end
