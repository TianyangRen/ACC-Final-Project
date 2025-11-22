package com.toothbrush.util;

import java.util.*;

public class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEndOfWord;
    int frequency;
    List<Object> references = new ArrayList<>(); // Store references to objects (e.g., Products)

    public TrieNode() {
        isEndOfWord = false;
        frequency = 0;
    }
}
