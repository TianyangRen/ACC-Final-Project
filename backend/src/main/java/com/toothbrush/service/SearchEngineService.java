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
    private static final String CSV_PATH = "d:\\desk\\ACC\\Final-Project\\burst_products.csv"; // Adjust path as needed

    @PostConstruct
    public void init() {
        vocabularyTrie = new Trie();
        loadProducts();
        buildVocabulary();
    }

    private void loadProducts() {
        try (CSVReader reader = new CSVReader(new FileReader(CSV_PATH))) {
            String[] line;
            reader.readNext(); // Skip header
            while ((line = reader.readNext()) != null) {
                Product product = new Product();
                product.setName(line[0]);
                product.setPrice(line[1]);
                product.setImageUrl(line[2]);
                product.setProductUrl(line[3]);
                product.setBrand(line[4]);
                product.setReviewCount(line[5]);
                product.setRating(line[6]);
                product.setInStock(line[7]);
                product.setDescription(line[8]);
                products.add(product);
            }
        } catch (IOException | CsvValidationException e) {
            e.printStackTrace();
            // Fallback or error handling
        }
    }

    private void buildVocabulary() {
        for (Product p : products) {
            // Add words from name and description to Trie
            String text = p.getName() + " " + p.getDescription();
            String[] words = text.toLowerCase().split("\\W+");
            for (String word : words) {
                if (!word.isEmpty()) {
                    vocabularyTrie.insert(word, p); // Build Inverted Index
                }
            }
        }
    }

    public List<Product> getAllProducts() {
        return products;
    }

    // Task 1: Spell Checking
    public Map<String, Object> checkSpelling(String word) {
        Map<String, Object> result = new HashMap<>();
        word = word.toLowerCase();
        boolean exists = vocabularyTrie.search(word);
        result.put("exists", exists);

        if (!exists) {
            List<String> suggestions = new ArrayList<>();
            List<String> allWords = vocabularyTrie.findWordsWithPrefix(""); 
            
            String finalWord = word;
            suggestions = allWords.stream()
                .sorted((w1, w2) -> Integer.compare(
                    EditDistance.calculate(finalWord, w1),
                    EditDistance.calculate(finalWord, w2)
                ))
                .limit(5)
                .collect(Collectors.toList());
            
            result.put("suggestions", suggestions);
        }
        return result;
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
    public List<Product> searchProducts(String keyword) {
        trackSearch(keyword);
        String lowerKeyword = keyword.toLowerCase();
        
        // Use Inverted Index to find candidate products (Task 6)
        List<Object> candidates = vocabularyTrie.searchReferences(lowerKeyword);
        if (candidates.isEmpty()) {
            return new ArrayList<>();
        }

        // Use Boyer-Moore to rank them by frequency (Task 5)
        BoyerMoore bm = new BoyerMoore(lowerKeyword);
        Map<Product, Integer> productScores = new HashMap<>();
        
        for (Object obj : candidates) {
            if (obj instanceof Product) {
                Product p = (Product) obj;
                String text = (p.getName() + " " + p.getDescription()).toLowerCase();
                int score = bm.countOccurrences(text);
                productScores.put(p, score);
            }
        }

        // Sort by score
        return productScores.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}

