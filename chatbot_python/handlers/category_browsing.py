import requests

def handle_category_browsing(category_name):
    '''Handler for Category Browsing intent. Redirects to category section page.'''

    # Map user-friendly category names to IDs (You can also fetch this from DB dynamically)
    category_mapping = {
        'Fruits & Vegetables': 1,
        'Dairy & Eggs': 2,
        'Bakery': 3,
        'Snacks & Beverages': 4,
        'Household': 5,
        'Meat & Seafood': 6,
        'Frozen Foods': 7,
        'Personal Care': 8,
        'Baby Products': 9,
        'Pet Supplies': 10,
        'Breakfast & Cereal': 11,
        'Condiments & Sauces': 12,
        'Canned & Packaged Foods': 13,
        'Health Foods & Supplements': 14,
        'Home & Kitchen': 15,
        'Electronics': 16,
        'Computer Accessories': 17,
        'Smart Devices': 18,
        'Gaming': 19,
        'Home Appliances': 20,
        'Clothing & Fashion': 21,
        'TV & Entertainment': 22,
        'Books & Media': 23,
        'Sports & Fitness': 24,
        'Beauty & Personal Care': 25,
        'Automotive': 26
    }
    category_name = category_name.strip().title()

    if category_name not in category_mapping:
        return None  # Return None if no match

    category_id = category_mapping[category_name]
    
    # Build frontend-friendly redirect URL
    return f"http://localhost:3000/products?category={category_id}"