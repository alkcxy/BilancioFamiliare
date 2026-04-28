Rails.application.config.secret_key_base = ENV.fetch("SECRET_KEY_BASE") {
  if Rails.env.production?
    raise "SECRET_KEY_BASE environment variable must be set in production"
  else
    "3410717bd63ac8fc174035624f9e93b07ef214fa40bfde894399d55c2251af14fdf600279d2bdf2e5932f9dba8df594f2aef30e925ac3df59f55374fa382ffda"
  end
}
