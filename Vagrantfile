# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
if ENV['http_proxy'] && !Vagrant.has_plugin?("vagrant-proxyconf")
        system('vagrant plugin install vagrant-proxyconf')

     raise("vagrant-proxyconf installed. Run command again.");
end
Vagrant.configure(2) do |config|
  if ENV['http_proxy'] && Vagrant.has_plugin?("vagrant-proxyconf")
    config.proxy.http     = ENV['http_proxy'] # set your proxy
    config.proxy.https    = ENV['http_proxy'] # set your proxy
    config.proxy.no_proxy = "localhost,127.0.0.1"
  end

  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://atlas.hashicorp.com/search.
  # download this box from
  # https://github.com/alkcxy/vivi.box
  config.vm.define :vivi32 do |td|
    td.vm.box = "alkcxy/vivi32-lite"
    td.vm.box_version = "0.1.0"
  end
#  config.ssh.username = "ubuntu"

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  config.vm.box_check_update = false

  config.vm.network "forwarded_port", guest: 3000, host: 3000

  # Define a Vagrant Push strategy for pushing to Atlas. Other push strategies
  # https://docs.vagrantup.com/v2/push/atlas.html for more information.
  # config.push.define "atlas" do |push|
  #   push.app = "YOUR_ATLAS_USERNAME/YOUR_APPLICATION_NAME"
  # end

  # Enable provisioning with a shell script. Additional provisioners such as
  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  config.vm.provider "virtualbox" do |vb|
  #  vb.gui = true
    ### Change network card to PCnet-FAST III
    # For NAT adapter
    vb.customize ["modifyvm", :id, "--nictype1", "Am79C973"]
    # For host-only adapter
    # vb.customize ["modifyvm", :id, "--nictype2", "Am79C973"]
    #   # Customize the amount of memory on the VM:
    vb.memory = 1024
    vb.cpus = 1
    vb.auto_nat_dns_proxy = false
    vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
  end

  #, type: "smb", mount_options: ["vers=3.02","mfsymlinks"]
  # View the documentation for the provider you are using for more
  # information on available options.

  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
  # config.vm.provision "shell", inline: <<-SHELL
  #   sudo apt-get update
  #   sudo apt-get install -y apache2
  # SHELL
end
