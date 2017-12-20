json.array!(@operations) do |operation|
  json.extract! operation, :id, :note, :sign, :amount, :type_id, :user_id, :date, :year, :month, :day, :created_at, :updated_at
  json.url operation_url(operation, format: :json)
  json.user do
    json.name operation.user.name
  end
  json.type do
    json.name operation.type.name
  end
  json.amount operation.amount.to_f
end
