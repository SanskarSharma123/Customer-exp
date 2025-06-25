from langchain_ollama import OllamaLLM
from prompt.intent_prompt import get_intent_prompt

model = OllamaLLM(model="gemma3:latest")

def classify_intent(user_query):
    prompt = get_intent_prompt(user_query)
    response = model.invoke(prompt)
    return response.lower().strip()
