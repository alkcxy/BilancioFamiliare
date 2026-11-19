require 'net/http'
require 'json'

module Ai
  class Mistral
    MODEL = ENV.fetch('MISTRAL_MODEL', 'mistral-large-4')
    REASONING_EFFORT = ENV.fetch('MISTRAL_REASONING_EFFORT', 'low')
    ENDPOINT = 'https://api.mistral.ai/v1/chat/completions'

    def extract_transactions(base64_data, content_type, prompt)
      api_key = ENV['MISTRAL_API_KEY']
      raise AiProvider::MissingApiKeyError, 'MISTRAL_API_KEY is not set' if api_key.blank?

      document_part = if content_type.to_s == 'application/pdf'
        { type: 'document_url', document_url: "data:application/pdf;base64,#{base64_data}" }
      else
        { type: 'image_url', image_url: { url: "data:#{content_type};base64,#{base64_data}" } }
      end

      data = post_json(api_key, {
        model: MODEL,
        temperature: 0,
        top_p: 1,
        reasoning_effort: REASONING_EFFORT,
        messages: [{ role: 'user', content: [document_part, { type: 'text', text: prompt }] }]
      })

      content = data.dig('choices', 0, 'message', 'content')
      raw = content.is_a?(Array) ? content.select { |p| p['type'] == 'text' }.map { |p| p['text'] }.join("\n") : content.to_s
      raise 'Mistral returned an empty response' if raw.strip.empty?
      raw.strip.gsub(/\A```(?:json)?\s*|\s*```\z/, '')
    end

    private

    def post_json(api_key, payload)
      uri = URI(ENDPOINT)
      req = Net::HTTP::Post.new(uri)
      req['Authorization'] = "Bearer #{api_key}"
      req['Content-Type'] = 'application/json'
      req.body = payload.to_json
      request_json(req)
    end

    def request_json(req)
      http = Net::HTTP.new(req.uri.host, req.uri.port)
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      http.read_timeout = 600
      http.open_timeout = 30
      res = begin
        http.request(req)
      rescue Net::ReadTimeout
        raise 'Mistral request timed out after 600s'
      end
      data = begin
        JSON.parse(res.body)
      rescue JSON::ParserError
        raise "Mistral returned an invalid response (HTTP #{res.code})" unless res.is_a?(Net::HTTPSuccess)
        {}
      end
      error_msg = data.dig('error', 'message') || data['message']
      Rails.logger.error("[Ai::Mistral] API error: #{error_msg}") if error_msg
      raise error_msg || "Mistral error (HTTP #{res.code})" unless res.is_a?(Net::HTTPSuccess)
      data
    end
  end
end
