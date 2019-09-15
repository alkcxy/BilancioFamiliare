json.cache! withdrawal do
  json.extract! withdrawal, :id, :date, :note, :year, :month, :day, :user_id, :complete, :archive, :created_at, :updated_at
  json.user do
    json.id withdrawal.user.id
    json.name withdrawal.user.name
  end
  json.amount withdrawal.amount.to_f
  json.url withdrawal_url(withdrawal, format: :json)
  json.created_at withdrawal.created_at.to_i
  json.updated_at withdrawal.updated_at.to_i
end
