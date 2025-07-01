from intent_service import classify_intent
import handlers.greet as greet
import handlers.product_search as product_search
import handlers.order_status as order_status
import handlers.return_policy as return_policy
import handlers.goodbye as goodbye
import handlers.unknown as unknown

print("E-Commerce AI Chatbot - Type 'exit' to quit.\n")

while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        break

    # intent = classify_intent(user_input)
    # print(f"[Intent Detected]: {intent}")

    # if intent == "product_search":
    #     products = product_search.handle_product_search(user_input)
    #     print("Products Found:", products)

    # elif intent == "order_status":
    #     order_status.handle()
    # elif intent == "return_policy":
    #     return_policy.handle()
    # elif intent == "greet":
    #     greet.handle()
    # elif intent == "goodbye":
    #     goodbye.handle()
    # else:
    #     unknown.handle()
