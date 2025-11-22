package com.toothbrush.controller;

import com.toothbrush.model.Product;
import com.toothbrush.service.SearchEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000") // Allow React frontend
public class SearchController {

    @Autowired
    private SearchEngineService searchService;

    @GetMapping("/products")
    public List<Product> getAllProducts(@RequestParam(required = false, defaultValue = "default") String sort) {
        return searchService.getAllProducts(sort);
    }

    @GetMapping("/search")
    public List<Product> search(@RequestParam String query, @RequestParam(required = false, defaultValue = "default") String sort) {
        return searchService.searchProducts(query, sort);
    }

    @GetMapping("/spellcheck")
    public Map<String, Object> spellCheck(@RequestParam String word) {
        return searchService.checkSpelling(word);
    }

    @GetMapping("/autocomplete")
    public List<String> autocomplete(@RequestParam String prefix) {
        return searchService.autocomplete(prefix);
    }

    @GetMapping("/frequency")
    public int getFrequency(@RequestParam String word) {
        return searchService.getWordFrequency(word);
    }

    @GetMapping("/top-searches")
    public List<Map<String, Object>> getTopSearches() {
        return searchService.getTopSearches().stream()
            .map(e -> Map.of("term", (Object)e.getKey(), "count", e.getValue()))
            .collect(java.util.stream.Collectors.toList());
    }
}
