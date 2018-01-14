json.cache! @operation do
  json.extract! @operation, :id, :note, :sign, :type_id, :user_id, :date, :year, :month, :day, :created_at, :updated_at
  json.type do
    json.id @operation.type.id
    json.name @operation.type.name
    json.spending_roof @operation.type.spending_roof.to_f
  end
  json.user do
    json.id @operation.user.id
    json.name @operation.user.name
  end
  json.amount @operation.amount.to_f
end
