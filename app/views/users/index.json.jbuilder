json.cache! ['users', User.maximum(:updated_at)] do
  json.array! @users, partial: 'users/user', as: :user
end
