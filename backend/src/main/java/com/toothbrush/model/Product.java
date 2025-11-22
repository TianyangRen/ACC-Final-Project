package com.toothbrush.model;

public class Product {
    private String name;
    private String price;
    private String imageUrl;
    private String productUrl;
    private String brand;
    private String reviewCount;
    private String rating;
    private String inStock;
    private String description;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPrice() { return price; }
    public void setPrice(String price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getProductUrl() { return productUrl; }
    public void setProductUrl(String productUrl) { this.productUrl = productUrl; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getReviewCount() { return reviewCount; }
    public void setReviewCount(String reviewCount) { this.reviewCount = reviewCount; }

    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }

    public String getInStock() { return inStock; }
    public void setInStock(String inStock) { this.inStock = inStock; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
