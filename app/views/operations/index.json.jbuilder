json.array!(@operations) do |operation|
  json.extract! operation, :id, :name, :date, :amount, :type_id
  json.url operation_url(operation, format: :json)
end
