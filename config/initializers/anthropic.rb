Anthropic.configure do |config|
  config.access_token = ENV['ANTHROPIC_API_KEY']
end

# Disable SSL verification for outbound requests (Zscaler intercepts TLS on this network).
# Same policy already applied to apt and rubygems in Dockerfile/Gemfile.
Faraday.default_connection_options = Faraday::ConnectionOptions.new(ssl: { verify: false })
