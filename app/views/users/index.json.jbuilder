json.cache! ['users', User.maximum(:updated_at)] do
  json.array!(@users) do |user|
    json.cache! user do
      json.extract! user, :id, :name, :email, :password_digest, :blocked
      json.url user_url(user, format: :json)
    end
  end
end
