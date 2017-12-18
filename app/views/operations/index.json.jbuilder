json.array!(@operations) do |operation|
  json.extract! operation, :id, :note, :sign, :amount, :type_id, :user_id, :date, :year, :month, :day, :created_at, :updated_at
  json.url operation_url(operation, format: :json)
end
