json.cache! type do
  json.extract! type, :id, :name, :description, :created_at, :updated_at, :master_type_id
  if type.spending_roof
    json.spending_roof type.spending_roof.to_f
  end
  json.master_type type.master_type
  json.url type_url(type, format: :json)
end
