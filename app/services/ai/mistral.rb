require 'net/http'
require 'json'

module Ai
  class Mistral
    MODEL = ENV.fetch('MISTRAL_MODEL', 'pixtral-large-latest')
    ENDPOINT = 'https://api.mistral.ai/v1/chat/completions'

    def extract_transactions(base64_data, content_type, prompt)
      api_key = ENV['MISTRAL_API_KEY']
      raise AiProvider::MissingApiKeyError, 'MISTRAL_API_KEY is not set' if api_key.blank?

      uri = URI(ENDPOINT)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      http.read_timeout = 120

      req = Net::HTTP::Post.new(uri)
      req['Content-Type'] = 'application/json'
      req['Authorization'] = "Bearer #{api_key}"
      req.body = {
        model: MODEL,
        temperature: 0,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: "data:#{content_type};base64,#{base64_data}" } },
            { type: 'text', text: prompt }
          ]
        }]
      }.to_json

      res = http.request(req)
      data = JSON.parse(res.body)

      error_msg = data.dig('error', 'message')
      Rails.logger.error("[Ai::Mistral] API error: #{error_msg}") if error_msg
      raise error_msg || 'Mistral error' unless res.is_a?(Net::HTTPSuccess)

      raw = data.dig('choices', 0, 'message', 'content').to_s
      raw.strip.gsub(/\A```(?:json)?\s*|\s*```\z/, '')
    end
  end
end
