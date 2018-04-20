json.cache! user do
  json.extract! user, :id, :name, :email, :password_digest, :blocked, :created_at, :updated_at
  json.url user_url(user, format: :json)
end
