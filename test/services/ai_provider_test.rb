require 'test_helper'

class AiProviderTest < ActiveSupport::TestCase
  def with_env(vars)
    original = vars.keys.to_h { |k| [k, ENV[k]] }
    vars.each { |k, v| v.nil? ? ENV.delete(k) : ENV[k] = v }
    yield
  ensure
    original.each { |k, v| v.nil? ? ENV.delete(k) : ENV[k] = v }
  end

  test "current defaults to gemini when AI_PROVIDER is not set" do
    with_env('AI_PROVIDER' => nil) do
      assert_instance_of Ai::Gemini, AiProvider.current
    end
  end

  test "current defaults to gemini when AI_PROVIDER is blank" do
    with_env('AI_PROVIDER' => '') do
      assert_instance_of Ai::Gemini, AiProvider.current
    end
  end

  test "current returns mistral when AI_PROVIDER is mistral" do
    with_env('AI_PROVIDER' => 'mistral') do
      assert_instance_of Ai::Mistral, AiProvider.current
    end
  end

  test "for raises UnknownProviderError on unknown provider" do
    error = assert_raises(AiProvider::UnknownProviderError) { AiProvider.resolve('openai') }
    assert_match(/openai/, error.message)
  end

  test "mistral raises MissingApiKeyError when MISTRAL_API_KEY is not set" do
    with_env('MISTRAL_API_KEY' => nil) do
      error = assert_raises(AiProvider::MissingApiKeyError) do
        Ai::Mistral.new.extract_transactions('AAAA', 'image/png', 'prompt')
      end
      assert_match(/MISTRAL_API_KEY/, error.message)
    end
  end

  test "gemini raises MissingApiKeyError when GOOGLE_AI_API_KEY is not set" do
    with_env('GOOGLE_AI_API_KEY' => nil) do
      assert_raises(AiProvider::MissingApiKeyError) do
        Ai::Gemini.new.extract_transactions('AAAA', 'image/png', 'prompt')
      end
    end
  end

  class FakeHttp
    attr_accessor :use_ssl, :verify_mode, :read_timeout, :open_timeout, :last_request

    def initialize(response)
      @response = response
    end

    def request(req)
      @last_request = req
      @response
    end
  end

  def http_response(klass, code, body)
    res = klass.new('1.1', code, 'msg')
    res.instance_variable_set(:@read, true)
    res.instance_variable_set(:@body, body)
    res
  end

  test "gemini sends the API key in the x-goog-api-key header, not in the URL" do
    res = http_response(Net::HTTPOK, 200, '{"candidates":[{"content":{"parts":[{"text":"[]"}]}}]}')
    fake = FakeHttp.new(res)
    with_env('GOOGLE_AI_API_KEY' => 'secret-key') do
      Net::HTTP.stub :new, fake do
        assert_equal '[]', Ai::Gemini.new.extract_transactions('AAAA', 'image/png', 'prompt')
      end
    end
    assert_equal 'secret-key', fake.last_request['x-goog-api-key']
    assert_no_match(/key=/, fake.last_request.path)
  end

  test "providers surface the API error message on non-200 JSON error bodies" do
    res = http_response(Net::HTTPBadGateway, 502, '{"error":{"message":"overloaded"}}')
    fake = FakeHttp.new(res)
    with_env('GOOGLE_AI_API_KEY' => 'k', 'MISTRAL_API_KEY' => 'k') do
      Net::HTTP.stub :new, fake do
        error = assert_raises(RuntimeError) { Ai::Gemini.new.extract_transactions('AAAA', 'image/png', 'p') }
        assert_match(/overloaded/, error.message)
        error = assert_raises(RuntimeError) { Ai::Mistral.new.extract_transactions('AAAA', 'image/png', 'p') }
        assert_match(/overloaded/, error.message)
      end
    end
  end

  test "providers raise a clear error on non-JSON error bodies instead of JSON::ParserError" do
    res = http_response(Net::HTTPBadGateway, 502, '<html>proxy error</html>')
    fake = FakeHttp.new(res)
    with_env('GOOGLE_AI_API_KEY' => 'k', 'MISTRAL_API_KEY' => 'k') do
      Net::HTTP.stub :new, fake do
        error = assert_raises(RuntimeError) { Ai::Gemini.new.extract_transactions('AAAA', 'image/png', 'p') }
        assert_no_match(/unexpected character/i, error.message)
        error = assert_raises(RuntimeError) { Ai::Mistral.new.extract_transactions('AAAA', 'image/png', 'p') }
        assert_no_match(/unexpected character/i, error.message)
      end
    end
  end

  test "gemini raises a clear error when the AI returns no content" do
    res = http_response(Net::HTTPOK, 200, '{"candidates":[]}')
    with_env('GOOGLE_AI_API_KEY' => 'k') do
      Net::HTTP.stub :new, FakeHttp.new(res) do
        error = assert_raises(RuntimeError) { Ai::Gemini.new.extract_transactions('AAAA', 'image/png', 'p') }
        assert_match(/empty response/, error.message)
      end
    end
  end

  test "mistral raises a clear error when the AI returns no content" do
    res = http_response(Net::HTTPOK, 200, '{"choices":[]}')
    with_env('MISTRAL_API_KEY' => 'k') do
      Net::HTTP.stub :new, FakeHttp.new(res) do
        error = assert_raises(RuntimeError) { Ai::Mistral.new.extract_transactions('AAAA', 'image/png', 'p') }
        assert_match(/empty response/, error.message)
      end
    end
  end
end
