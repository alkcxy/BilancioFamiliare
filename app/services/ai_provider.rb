module AiProvider
  class UnknownProviderError < StandardError; end
  class MissingApiKeyError < StandardError; end

  def self.current
    resolve(ENV.fetch('AI_PROVIDER', 'gemini'))
  end

  def self.resolve(name)
    case name.to_s
    when 'gemini' then Ai::Gemini.new
    when 'mistral' then Ai::Mistral.new
    else raise UnknownProviderError, "Unknown AI provider: #{name}"
    end
  end
end
