json.extract! @type, :id, :name, :description, :created_at, :updated_at, :master_type_id
json.master_type = @type.master_type
