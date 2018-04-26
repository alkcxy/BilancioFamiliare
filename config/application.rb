require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module BilancioFamiliare
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.0
    config.action_cable.mount_path = '/cable'
    config.i18n.default_locale = :it
    config.time_zone = "Rome"
    config.active_record.default_timezone = :local
    config.active_record.sqlite3.represent_boolean_as_integer = config_for(:bilancio)['represent_boolean_as_integer']
    config.bilancio = config_for(:bilancio)
  end
end
