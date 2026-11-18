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
end
