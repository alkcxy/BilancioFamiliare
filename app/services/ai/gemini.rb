require 'net/http'
require 'json'

module Ai
  class Gemini
    MODEL = 'gemini-2.5-flash'

    def extract_transactions(base64_data, content_type, prompt)
      api_key = ENV['GOOGLE_AI_API_KEY']
      raise AiProvider::MissingApiKeyError, 'GOOGLE_AI_API_KEY is not set' if api_key.blank?

      uri = URI("https://generativelanguage.googleapis.com/v1beta/models/#{MODEL}:generateContent")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      http.read_timeout = 600
      http.open_timeout = 30

      req = Net::HTTP::Post.new(uri)
      req['Content-Type'] = 'application/json'
      req['x-goog-api-key'] = api_key
      req.body = {
        contents: [{
          parts: [
            { inline_data: { mime_type: content_type, data: base64_data } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } }
      }.to_json

      res = begin
        http.request(req)
      rescue Net::ReadTimeout
        raise 'Gemini request timed out after 600s'
      end
      data = begin
        JSON.parse(res.body)
      rescue JSON::ParserError
        raise "Gemini returned an invalid response (HTTP #{res.code})" unless res.is_a?(Net::HTTPSuccess)
        {}
      end

      error_msg = data.dig('error', 'message')
      Rails.logger.error("[Ai::Gemini] API error: #{error_msg}") if error_msg
      raise error_msg || "Gemini error (HTTP #{res.code})" unless res.is_a?(Net::HTTPSuccess)

      raw = data.dig('candidates', 0, 'content', 'parts', 0, 'text').to_s
      raise 'Gemini returned an empty response' if raw.strip.empty?
      raw.strip.gsub(/\A```(?:json)?\s*|\s*```\z/, '')
    end
  end
end
