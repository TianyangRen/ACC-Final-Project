package com.toothbrush.util;

import java.util.*;

public class Trie {
    private TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

    public void insert(String word) {
        TrieNode current = root;
        for (char c : word.toCharArray()) {
            current.children.putIfAbsent(c, new TrieNode());
            current = current.children.get(c);
        }
        current.isEndOfWord = true;
        current.frequency++;
    }

    public void insert(String word, Object reference) {
        TrieNode current = root;
        for (char c : word.toCharArray()) {
            current.children.putIfAbsent(c, new TrieNode());
            current = current.children.get(c);
        }
        current.isEndOfWord = true;
        current.frequency++;
        if (reference != null && !current.references.contains(reference)) {
            current.references.add(reference);
        }
    }

    public boolean search(String word) {
        TrieNode current = root;
        for (char c : word.toCharArray()) {
            TrieNode node = current.children.get(c);
            if (node == null) {
                return false;
            }
            current = node;
        }
        return current.isEndOfWord;
    }

    public List<Object> searchReferences(String word) {
        TrieNode current = root;
        for (char c : word.toCharArray()) {
            TrieNode node = current.children.get(c);
            if (node == null) {
                return Collections.emptyList();
            }
            current = node;
        }
        return current.isEndOfWord ? current.references : Collections.emptyList();
    }

    public List<String> findWordsWithPrefix(String prefix) {
        List<String> words = new ArrayList<>();
        TrieNode current = root;
        for (char c : prefix.toCharArray()) {
            TrieNode node = current.children.get(c);
            if (node == null) {
                return words;
            }
            current = node;
        }
        collectWords(current, prefix, words);
        return words;
    }

    private void collectWords(TrieNode node, String prefix, List<String> words) {
        if (node.isEndOfWord) {
            words.add(prefix);
        }
        for (Map.Entry<Character, TrieNode> entry : node.children.entrySet()) {
            collectWords(entry.getValue(), prefix + entry.getKey(), words);
        }
    }

    public int getFrequency(String word) {
        TrieNode current = root;
        for (char c : word.toCharArray()) {
            TrieNode node = current.children.get(c);
            if (node == null) {
                return 0;
            }
            current = node;
        }
        return current.isEndOfWord ? current.frequency : 0;
    }

    public List<String> getAllWords() {
        List<String> words = new ArrayList<>();
        collectWords(root, "", words);
        return words;
    }
}
