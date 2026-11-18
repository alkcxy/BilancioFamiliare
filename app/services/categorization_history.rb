module CategorizationHistory
  WINDOW = 1.year
  MAX_ROWS = 2000
  MAX_ENTRIES = 200

  def self.mapping
    rows = Operation.joins(:type)
      .where('operations.date >= ?', WINDOW.ago)
      .where.not(note: [nil, ''])
      .order(date: :desc)
      .limit(MAX_ROWS)
      .pluck(:note, 'types.name')

    counts = Hash.new { |h, k| h[k] = Hash.new(0) }
    rows.each do |note, type_name|
      key = normalize(note)
      counts[key][type_name] += 1 unless key.empty?
    end

    totals = counts.transform_values { |by_type| by_type.values.sum }
    counts.map { |note, by_type| [note, by_type.max_by { |_, c| c }.first] }
      .sort_by { |note, _| -totals[note] }
      .first(MAX_ENTRIES)
      .to_h
  end

  def self.normalize(note)
    note.to_s.strip.downcase.gsub(/\s+/, ' ')
  end
end
