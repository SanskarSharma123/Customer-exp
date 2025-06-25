def get_intent_prompt(user_query):
    return f"""
You are an intent classifier for an eCommerce chatbot. Classify the user message into one of these intents:

- greet → greetings or starting conversation
- product_search → searching, buying, or asking about products
- order_status → asking about order tracking or delivery
- return_policy → asking about returns, refunds, or exchanges
- goodbye → ending the conversation
- unknown → unclear or unrelated message


Examples:

User: Hi  
Intent: greet

User: Hello  
Intent: greet

User: Hey there  
Intent: greet

User: Good morning  
Intent: greet

User: Good evening  
Intent: greet

User: How are you?  
Intent: greet

User: I want to buy a smartphone  
Intent: product_search

User: Show me smartphones under 20000  
Intent: product_search

User: Do you sell wireless headphones?  
Intent: product_search

User: Looking for gaming laptops  
Intent: product_search

User: Suggest a smartwatch  
Intent: product_search

User: Do you have winter jackets?  
Intent: product_search

User: Find me Bluetooth speakers  
Intent: product_search

User: Recommend some affordable shoes  
Intent: product_search

User: Where is my order?  
Intent: order_status

User: Track my order  
Intent: order_status

User: When will my package arrive?  
Intent: order_status

User: Order status for order #4567  
Intent: order_status

User: Has my order shipped yet?  
Intent: order_status

User: Delivery is delayed, why?  
Intent: order_status

User: What is your return policy?  
Intent: return_policy

User: Can I return a damaged product?  
Intent: return_policy

User: How to exchange an item?  
Intent: return_policy

User: I want a refund  
Intent: return_policy

User: How does replacement work?  
Intent: return_policy

User: Is there a warranty?  
Intent: return_policy

User: Bye  
Intent: goodbye

User: Goodbye  
Intent: goodbye

User: Thanks for your help  
Intent: goodbye

User: Talk to you later  
Intent: goodbye

User: See you  
Intent: goodbye

User: Thank you  
Intent: goodbye

User: Can you help with something else?  
Intent: unknown

User: What's the weather today?  
Intent: unknown

User: Tell me a joke  
Intent: unknown

User: I like pizza  
Intent: unknown

User: I'm bored  
Intent: unknown

User: Do you know football?  
Intent: unknown

Now classify this message:  
"{user_query}"  

Only reply with the intent name.
"""
