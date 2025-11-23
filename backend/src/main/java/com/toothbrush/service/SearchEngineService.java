package com.toothbrush.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.toothbrush.model.Product;
import com.toothbrush.util.*;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.FileReader;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SearchEngineService {

    private List<Product> products = new ArrayList<>();
    private Trie vocabularyTrie;
    private Map<String, Integer> searchFrequency = new TreeMap<>(); // Red-Black Tree
    private static final String CSV_PATH = "d:\\desk\\ACC\\Final-Project\\all_toothbrushes.csv"; // Adjust path as needed

    @PostConstruct
    public void init() {
        vocabularyTrie = new Trie();
        loadProducts();
        buildVocabulary();
    }

    private void loadProducts() {
        try (CSVReader reader = new CSVReader(new java.io.InputStreamReader(new java.io.FileInputStream(CSV_PATH), java.nio.charset.StandardCharsets.UTF_8))) {
            String[] line;
            reader.readNext(); // Skip header
            while ((line = reader.readNext()) != null) {
                if (line.length < 8) {
                    continue; // Skip lines that don't have enough columns
                }
                Product product = new Product();
                // CSV Format: Brand, Title, Price, Image URL, Product URL, Battery_Life, Waterproof_Rating, Toothbrush_Type
                product.setBrand(line[0]);
                product.setName(line[1]);
                product.setPrice(line[2]);
                product.setImageUrl(line[3]);
                product.setProductUrl(line[4]);
                product.setBatteryLife(line[5]);
                product.setWaterproofRating(line[6]);
                product.setToothbrushType(line[7]);
                
                // Default values for missing fields
                product.setReviewCount("0");
                product.setRating("0.0");
                product.setInStock("Unknown");
                product.setDescription(""); // Empty description to avoid nulls

                products.add(product);
            }
        } catch (IOException | CsvValidationException e) {
            e.printStackTrace();
            // Fallback or error handling
        }
    }

    private void buildVocabulary() {
        for (Product p : products) {
            // Add words from name ONLY to Trie
            String text = p.getName();
            String[] words = text.toLowerCase().split("\\W+");
            for (String word : words) {
                if (!word.isEmpty()) {
                    vocabularyTrie.insert(word, p); // Build Inverted Index
                }
            }
        }
    }

    public List<String> getAllBrands() {
        return products.stream()
                .map(Product::getBrand)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<String> getAllToothbrushTypes() {
        return products.stream()
                .map(Product::getToothbrushType)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<Product> getAllProducts(List<String> sort, List<String> brands, List<String> types) {
        List<Product> all = products.stream()
                .filter(p -> brands == null || brands.isEmpty() || brands.contains(p.getBrand()))
                .filter(p -> types == null || types.isEmpty() || types.contains(p.getToothbrushType()))
                .collect(Collectors.toList());

        applySorting(all, sort);
        return all;
    }

    // Task 1: Spell Checking
    public Map<String, Object> checkSpelling(String query) {
        Map<String, Object> result = new HashMap<>();
        String lowerQuery = query.toLowerCase();
        String[] words = lowerQuery.split("\\W+");
        
        boolean allExist = true;
        for (String w : words) {
            if (!w.isEmpty() && !vocabularyTrie.search(w)) {
                allExist = false;
                break;
            }
        }
        result.put("exists", allExist);

        if (!allExist) {
            List<String> suggestions = new ArrayList<>();
            List<String> allVocabulary = vocabularyTrie.findWordsWithPrefix("");

            if (words.length > 1) {
                // Phrase suggestion logic with validation
                List<List<String>> allCandidates = new ArrayList<>();
                
                for (String w : words) {
                    if (w.isEmpty()) continue;
                    if (vocabularyTrie.search(w)) {
                        allCandidates.add(Collections.singletonList(w));
                    } else {
                        String finalW = w;
                        List<String> candidates = allVocabulary.stream()
                            .map(dictWord -> new AbstractMap.SimpleEntry<>(dictWord, EditDistance.calculate(finalW, dictWord)))
                            .filter(e -> e.getValue() <= 2)
                            .sorted(Map.Entry.comparingByValue())
                            .limit(3) // Top 3 candidates
                            .map(Map.Entry::getKey)
                            .collect(Collectors.toList());
                        
                        if (candidates.isEmpty()) {
                            candidates.add(w); // Keep original if no correction found
                        }
                        allCandidates.add(candidates);
                    }
                }
                
                List<String> validPhrases = new ArrayList<>();
                generateCombinations(allCandidates, 0, "", validPhrases);
                
                if (!validPhrases.isEmpty()) {
                    suggestions.add(validPhrases.get(0));
                }
            } else {
                // Single word suggestion
                String finalWord = lowerQuery;
                suggestions = allVocabulary.stream()
                    .map(w -> new AbstractMap.SimpleEntry<>(w, EditDistance.calculate(finalWord, w)))
                    .filter(entry -> entry.getValue() <= 2)
                    .sorted(Map.Entry.comparingByValue())
                    .limit(5)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());
            }
            
            result.put("suggestions", suggestions);
        }
        return result;
    }

    private void generateCombinations(List<List<String>> lists, int depth, String current, List<String> result) {
        if (!result.isEmpty()) return; // Found one, stop (Greedy)

        if (depth == lists.size()) {
            if (hasMatches(current.trim())) {
                result.add(current.trim());
            }
            return;
        }

        for (String word : lists.get(depth)) {
            generateCombinations(lists, depth + 1, current + " " + word, result);
        }
    }

    private boolean hasMatches(String query) {
        String[] words = query.toLowerCase().split("\\W+");
        Set<Product> candidateSet = new HashSet<>();
        boolean firstWord = true;

        for (String word : words) {
            if (word.isEmpty()) continue;
            
            List<Object> wordRefs = vocabularyTrie.searchReferences(word);
            Set<Product> wordProducts = new HashSet<>();
            for (Object obj : wordRefs) {
                if (obj instanceof Product) {
                    wordProducts.add((Product) obj);
                }
            }

            if (firstWord) {
                candidateSet.addAll(wordProducts);
                firstWord = false;
            } else {
                candidateSet.retainAll(wordProducts);
            }

            if (candidateSet.isEmpty()) {
                return false;
            }
        }
        return !candidateSet.isEmpty();
    }

    // Task 2: Word Completion
    public List<String> autocomplete(String prefix) {
        return vocabularyTrie.findWordsWithPrefix(prefix.toLowerCase());
    }

    // Task 3: Frequency Count (using Boyer-Moore)
    public int getWordFrequency(String word) {
        int count = 0;
        BoyerMoore bm = new BoyerMoore(word.toLowerCase());
        for (Product p : products) {
            String text = (p.getName() + " " + p.getDescription()).toLowerCase();
            count += bm.countOccurrences(text);
        }
        return count;
    }

    // Task 4: Search Frequency
    public void trackSearch(String query) {
        searchFrequency.put(query, searchFrequency.getOrDefault(query, 0) + 1);
    }

    public List<Map.Entry<String, Integer>> getTopSearches() {
        return searchFrequency.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(10)
                .collect(Collectors.toList());
    }

    // Task 5 & 6: Page Ranking & Inverted Indexing
    public List<Product> searchProducts(String keyword, List<String> sort, List<String> brands, List<String> types) {
        trackSearch(keyword);
        String lowerKeyword = keyword.toLowerCase();
        String[] searchWords = lowerKeyword.split("\\W+"); // Split query into words

        Set<Product> candidateSet = new HashSet<>();
        boolean firstWord = true;

        // 1. Retrieve candidates for each word and find intersection (AND logic)
        for (String word : searchWords) {
            if (word.isEmpty()) continue;
            
            List<Object> wordRefs = vocabularyTrie.searchReferences(word);
            Set<Product> wordProducts = new HashSet<>();
            for (Object obj : wordRefs) {
                if (obj instanceof Product) {
                    wordProducts.add((Product) obj);
                }
            }

            if (firstWord) {
                candidateSet.addAll(wordProducts);
                firstWord = false;
            } else {
                candidateSet.retainAll(wordProducts); // Intersection
            }

            if (candidateSet.isEmpty()) {
                return new ArrayList<>(); // No products contain all words
            }
        }

        if (candidateSet.isEmpty()) {
            return new ArrayList<>();
        }

        // Filter by brand if provided
        if (brands != null && !brands.isEmpty()) {
            candidateSet = candidateSet.stream()
                    .filter(p -> brands.contains(p.getBrand()))
                    .collect(Collectors.toSet());
            
            if (candidateSet.isEmpty()) {
                return new ArrayList<>();
            }
        }

        // Filter by toothbrush type if provided
        if (types != null && !types.isEmpty()) {
            candidateSet = candidateSet.stream()
                    .filter(p -> types.contains(p.getToothbrushType()))
                    .collect(Collectors.toSet());
            
            if (candidateSet.isEmpty()) {
                return new ArrayList<>();
            }
        }

        // 2. Use Boyer-Moore to rank them by frequency (Task 5)
        // We sum the occurrences of EACH search word in the product name
        Map<Product, Integer> productScores = new HashMap<>();
        
        for (Product p : candidateSet) {
            int totalScore = 0;
            String text = p.getName().toLowerCase();
            
            // Score based on individual words
            for (String word : searchWords) {
                if (!word.isEmpty()) {
                    BoyerMoore bm = new BoyerMoore(word);
                    totalScore += bm.countOccurrences(text);
                }
            }
            
            // Bonus score for exact phrase match
            if (searchWords.length > 1) {
                 BoyerMoore phraseBm = new BoyerMoore(lowerKeyword);
                 totalScore += phraseBm.countOccurrences(text) * 10; // Give higher weight to exact phrase
            }

            productScores.put(p, totalScore);
        }

        // Initial sort by score (relevance)
        List<Product> results = productScores.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Apply additional sorting if requested
        applySorting(results, sort);

        return results;
    }

    private double parsePrice(Product p) {
        try {
            String priceStr = p.getPrice().replaceAll("[^\\d.]", "");
            return Double.parseDouble(priceStr);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private int parseBatteryLife(Product p) {
        try {
            String batteryStr = p.getBatteryLife().trim();
            return Integer.parseInt(batteryStr);
        } catch (NumberFormatException | NullPointerException e) {
            return 0;
        }
    }

    private int getWaterproofLevel(Product p) {
        String rating = p.getWaterproofRating();
        if (rating == null) return 0;
        rating = rating.trim().toUpperCase();
        if (rating.contains("IPX8")) return 3;
        if (rating.contains("IPX7")) return 2;
        if (rating.contains("IP")) return 1;
        return 0;
    }

    private void applySorting(List<Product> products, List<String> sorts) {
        if (sorts == null || sorts.isEmpty() || (sorts.size() == 1 && "default".equals(sorts.get(0)))) {
            return;
        }

        List<String> flatSorts = new ArrayList<>();
        for (String s : sorts) {
            if (s.contains(",")) {
                flatSorts.addAll(Arrays.asList(s.split(",")));
            } else {
                flatSorts.add(s);
            }
        }

        Comparator<Product> comparator = null;

        for (String sort : flatSorts) {
            Comparator<Product> currentComparator = null;
            if ("price_asc".equals(sort)) {
                currentComparator = Comparator.comparingDouble(this::parsePrice);
            } else if ("price_desc".equals(sort)) {
                currentComparator = Comparator.comparingDouble(this::parsePrice).reversed();
            } else if ("battery_asc".equals(sort)) {
                currentComparator = Comparator.comparingInt(this::parseBatteryLife);
            } else if ("battery_desc".equals(sort)) {
                currentComparator = Comparator.comparingInt(this::parseBatteryLife).reversed();
            } else if ("waterproof_asc".equals(sort)) {
                currentComparator = Comparator.comparingInt(this::getWaterproofLevel);
            } else if ("waterproof_desc".equals(sort)) {
                currentComparator = Comparator.comparingInt(this::getWaterproofLevel).reversed();
            }

            if (currentComparator != null) {
                if (comparator == null) {
                    comparator = currentComparator;
                } else {
                    comparator = comparator.thenComparing(currentComparator);
                }
            }
        }

        if (comparator != null) {
            products.sort(comparator);
        }
    }
}

