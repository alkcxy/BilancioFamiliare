require 'net/http'
require 'json'

module GeminiService
  MODEL = 'gemini-2.5-flash'

  def self.extract_transactions(base64_data, content_type, prompt)
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/#{MODEL}:generateContent?key=#{ENV['GOOGLE_AI_API_KEY']}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    http.read_timeout = 120

    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{
        parts: [
          { inline_data: { mime_type: content_type, data: base64_data } },
          { text: prompt }
        ]
      }],
      generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } }
    }.to_json

    res = http.request(req)
    data = JSON.parse(res.body)

    error_msg = data.dig('error', 'message')
    Rails.logger.error("[GeminiService] API error: #{error_msg}") if error_msg
    raise error_msg || 'Gemini error' unless res.is_a?(Net::HTTPSuccess)

    raw = data.dig('candidates', 0, 'content', 'parts', 0, 'text').to_s
    raw.strip.gsub(/\A```(?:json)?\s*|\s*```\z/, '')
  end
end
