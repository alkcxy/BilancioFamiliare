require 'net/http'
require 'json'
require 'securerandom'

module Ai
  class Mistral
    MODEL = ENV.fetch('MISTRAL_MODEL', 'mistral-large-latest')
    OCR_MODEL = ENV.fetch('MISTRAL_OCR_MODEL', 'mistral-ocr-latest')
    API_BASE = 'https://api.mistral.ai/v1'

    def extract_transactions(base64_data, content_type, prompt)
      api_key = ENV['MISTRAL_API_KEY']
      raise AiProvider::MissingApiKeyError, 'MISTRAL_API_KEY is not set' if api_key.blank?

      text = if content_type.to_s == 'application/pdf'
        ocr_text(api_key, Base64.decode64(base64_data))
      else
        nil
      end
      chat(api_key, base64_data, content_type, prompt, text)
    end

    private

    def chat(api_key, base64_data, content_type, prompt, ocr_text)
      content = if ocr_text
        [{ type: 'text', text: "Bank statement extracted text:\n#{ocr_text}\n\n#{prompt}" }]
      else
        [
          { type: 'image_url', image_url: { url: "data:#{content_type};base64,#{base64_data}" } },
          { type: 'text', text: prompt }
        ]
      end
      data = post_json(api_key, "#{API_BASE}/chat/completions", {
        model: MODEL,
        temperature: 0,
        top_p: 1,
        messages: [{ role: 'user', content: content }]
      })
      content = data.dig('choices', 0, 'message', 'content')
      raw = content.is_a?(Array) ? content.select { |p| p['type'] == 'text' }.map { |p| p['text'] }.join("\n") : content.to_s
      raise 'Mistral returned an empty response' if raw.strip.empty?
      raw.strip.gsub(/\A```(?:json)?\s*|\s*```\z/, '')
    end

    def ocr_text(api_key, raw_pdf)
      file_id = upload(api_key, raw_pdf)
      data = post_json(api_key, "#{API_BASE}/ocr", {
        model: OCR_MODEL,
        document: { type: 'file', file_id: file_id }
      })
      pages = data['pages'] || []
      pages.map { |p| p['markdown'].to_s }.join("\n\n").presence || raise('Mistral OCR returned no text')
    end

    def upload(api_key, raw_pdf)
      boundary = "vibe#{SecureRandom.hex(8)}"
      body = "--#{boundary}\r\n" \
        "Content-Disposition: form-data; name=\"purpose\"\r\n\r\nocr\r\n" \
        "--#{boundary}\r\n" \
        "Content-Disposition: form-data; name=\"file\"; filename=\"statement.pdf\"\r\n" \
        "Content-Type: application/pdf\r\n\r\n#{raw_pdf}\r\n" \
        "--#{boundary}--\r\n"
      uri = URI("#{API_BASE}/files")
      req = Net::HTTP::Post.new(uri)
      req['Authorization'] = "Bearer #{api_key}"
      req['Content-Type'] = "multipart/form-data; boundary=#{boundary}"
      req.body = body
      data = request_json(req)
      data['id'].presence || raise("Mistral file upload failed: #{data['message']}")
    end

    def post_json(api_key, url, payload)
      uri = URI(url)
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
      http.read_timeout = 120
      http.open_timeout = 30
      res = http.request(req)
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
