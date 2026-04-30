ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'
require 'minitest/mock'

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  def auth_headers(user)
    token = JWT.encode({user: {id: user.id, name: user.name, email: user.email}}, Rails.application.config.bilancio[:token_key_base], 'HS512')
    { authorization: "Bearer #{token}" }
  end
end
