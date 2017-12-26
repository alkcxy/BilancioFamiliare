json.array!(@users) do |user|
  json.extract! user, :id, :name, :email, :password_digest, :blocked
  json.url user_url(user, format: :json)
end
