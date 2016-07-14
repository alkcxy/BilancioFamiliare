class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  scope :id_and_maximum_updated_at, lambda { select("#{self.name.downcase.pluralize}.id, max(#{self.name.downcase.pluralize}.updated_at) max_updated_at").first }
end
