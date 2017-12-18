json.extract! @operation, :id, :note, :sign, :amount, :type_id, :user_id, :date, :year, :month, :day, :created_at, :updated_at
json.type do
  json.name @operation.type.name
end
json.user do
  json.name @operation.user.name
end
