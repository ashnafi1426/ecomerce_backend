/**
 * Spell Check Service
 * Provides spell correction and "Did you mean?" suggestions
 */

const supabase = require('../../config/supabase');

class SpellCheckService {
  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Get spell correction suggestions
   * @param {string} query - Search query to check
   * @param {number} maxDistance - Maximum edit distance (default: 2)
   * @returns {Promise<Object>} Spell correction suggestions
   */
  async getSpellingSuggestions(query, maxDistance = 2) {
    try {
      if (!query || query.trim() === '') {
        return {
          success: true,
          data: {
            hasCorrection: false,
            originalQuery: query,
            suggestions: []
          }
        };
      }

      const searchTerm = query.toLowerCase().trim();
      const words = searchTerm.split(/\s+/);

      // Get dictionary from product titles and search history
      const [productsResult, searchHistoryResult] = await Promise.all([
        supabase
          .from('products')
          .select('title')
          .eq('status', 'active')
          .eq('approval_status', 'approved')
          .limit(1000),
        supabase
          .from('search_history')
          .select('search_query')
          .gt('results_count', 0)
          .order('created_at', { ascending: false })
          .limit(500)
      ]);

      if (productsResult.error) throw productsResult.error;
      if (searchHistoryResult.error) throw searchHistoryResult.error;

      // Build dictionary of words
      const dictionary = new Set();
      
      // Add words from product titles
      productsResult.data.forEach(product => {
        const titleWords = product.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
          if (word.length > 2) dictionary.add(word);
        });
      });

      // Add words from successful searches
      searchHistoryResult.data.forEach(item => {
        const queryWords = item.search_query.toLowerCase().split(/\s+/);
        queryWords.forEach(word => {
          if (word.length > 2) dictionary.add(word);
        });
      });

      // Check each word for spelling
      const corrections = [];
      let hasCorrection = false;

      for (const word of words) {
        if (word.length <= 2) {
          corrections.push(word);
          continue;
        }

        // Check if word exists in dictionary
        if (dictionary.has(word)) {
          corrections.push(word);
          continue;
        }

        // Find closest match
        let bestMatch = word;
        let bestDistance = maxDistance + 1;

        for (const dictWord of dictionary) {
          // Skip if length difference is too large
          if (Math.abs(dictWord.length - word.length) > maxDistance) {
            continue;
          }

          const distance = this.levenshteinDistance(word, dictWord);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = dictWord;
          }
        }

        if (bestDistance <= maxDistance && bestMatch !== word) {
          corrections.push(bestMatch);
          hasCorrection = true;
        } else {
          corrections.push(word);
        }
      }

      const correctedQuery = corrections.join(' ');

      return {
        success: true,
        data: {
          hasCorrection,
          originalQuery: query,
          correctedQuery: hasCorrection ? correctedQuery : null,
          suggestions: hasCorrection ? [correctedQuery] : []
        }
      };

    } catch (error) {
      console.error('Get spelling suggestions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get alternative search suggestions
   * @param {string} query - Original query
   * @returns {Promise<Object>} Alternative suggestions
   */
  async getAlternativeSuggestions(query) {
    try {
      if (!query || query.trim() === '') {
        return {
          success: true,
          data: { suggestions: [] }
        };
      }

      const searchTerm = query.toLowerCase().trim();

      // Get similar successful searches
      const { data, error } = await supabase
        .from('search_history')
        .select('search_query, results_count')
        .gt('results_count', 0)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Find similar queries using word overlap
      const queryWords = new Set(searchTerm.split(/\s+/));
      const suggestions = [];

      data.forEach(item => {
        const itemQuery = item.search_query.toLowerCase().trim();
        if (itemQuery === searchTerm) return;

        const itemWords = new Set(itemQuery.split(/\s+/));
        
        // Calculate word overlap
        const overlap = [...queryWords].filter(word => itemWords.has(word)).length;
        const similarity = overlap / Math.max(queryWords.size, itemWords.size);

        if (similarity > 0.3 && similarity < 1) {
          suggestions.push({
            query: item.search_query,
            similarity: similarity,
            resultsCount: item.results_count
          });
        }
      });

      // Sort by similarity and results count
      suggestions.sort((a, b) => {
        if (Math.abs(a.similarity - b.similarity) < 0.1) {
          return b.resultsCount - a.resultsCount;
        }
        return b.similarity - a.similarity;
      });

      return {
        success: true,
        data: {
          suggestions: suggestions.slice(0, 5).map(s => s.query)
        }
      };

    } catch (error) {
      console.error('Get alternative suggestions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SpellCheckService();
