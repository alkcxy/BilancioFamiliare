json.array!(@types) do |type|
  json.extract! type, :id, :name, :description, :master_type_id
  json.url type_url(type, format: :json)
  json.master_type type.master_type
  if type.spending_roof
    json.spending_roof type.spending_roof.to_f
  end
end
