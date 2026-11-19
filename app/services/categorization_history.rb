module CategorizationHistory
  WINDOW = 1.year
  MAX_ROWS = 2000
  MAX_ENTRIES = 200
  MAX_PATTERNS = 100
  MIN_TOKEN_LENGTH = 4

  def self.mapping
    counts = count_by { |note, _| normalize(note) }
    top_entries(counts, MAX_ENTRIES)
  end

  def self.patterns
    counts = count_by { |note, _| tokens(note) }
    top_entries(counts, MAX_PATTERNS)
  end

  def self.normalize(note)
    note.to_s.strip.downcase.gsub(/\s+/, ' ')
  end

  def self.tokens(note)
    normalize(note).split(/[^a-z0-9àèéìòù]+/).select { |w| w.length >= MIN_TOKEN_LENGTH }
  end

  def self.count_by
    rows = Operation.joins(:type)
      .where('operations.date >= ?', WINDOW.ago)
      .where("COALESCE(NULLIF(raw_note, ''), note) IS NOT NULL AND COALESCE(NULLIF(raw_note, ''), note) != ''")
      .order(date: :desc)
      .limit(MAX_ROWS)
      .pluck(Arel.sql("COALESCE(NULLIF(raw_note, ''), note)"), 'types.name')

    counts = Hash.new { |h, k| h[k] = Hash.new(0) }
    rows.each do |note, type_name|
      Array(yield(note, type_name)).each { |key| counts[key][type_name] += 1 unless key.to_s.empty? }
    end
    counts
  end
  private_class_method :count_by

  def self.top_entries(counts, limit)
    totals = counts.transform_values { |by_type| by_type.values.sum }
    counts.map { |key, by_type| [key, by_type.max_by { |_, c| c }.first] }
      .sort_by { |key, _| -totals[key] }
      .first(limit)
      .to_h
  end
  private_class_method :top_entries
end
