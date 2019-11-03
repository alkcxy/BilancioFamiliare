unless Rails.env == "test"
  require 'prometheus/client'
  module Prometheus
    module Controller
      prometheus = Prometheus::Client.registry
      gauge = Prometheus::Client::Gauge.new(:bilancio, docstring: 'healtcheck')
      prometheus.register(gauge)
    end
  end
end
