import json
import random

# System configuration
system_prompt = "You are an expert assistant in restaurant service operations and dish demand prediction. Your goal is to provide accurate recommendations based on service data and technical culinary suggestions."

# Data templates for "Dish Prediction" and "Service Planning"
templates = [
    {
        "user": "Which dish should I suggest today with 80% humidity and 15C?",
        "assistant": "With high humidity and cool temperature, the prediction suggests warm comfort dishes. I recommend Wild Mushroom Risotto or Seafood Bisque to increase average ticket value."
    },
    {
        "user": "Service forecast for a group of 15 people at 21:30.",
        "assistant": "For a group of that size during peak hours, the service prediction indicates adding 2 kitchen staff and an estimated 12-minute wait time for starters."
    },
    {
        "user": "What is the demand prediction for fresh sole with the current inventory?",
        "assistant": "Since inventory is high (10kg) and it is Friday, demand prediction is high. I suggest adding it as the 'Chef's Recommendation' to ensure product turnover."
    },
    {
        "user": "Table turnover estimate for Saturday night.",
        "assistant": "Historical prediction indicates a turnover of 1.8 tables per shift. It is recommended to speed up coffee service in the lounge area to free main dining tables."
    },
    {
        "user": "We have excessive tenderloin stock, how should we proceed?",
        "assistant": "Dish prediction suggests pairing it with a reserve red wine in the tasting menu. This will optimize stock by 40% during dinner service."
    }
]

def generate_jsonl(filename, count):
    with open(filename, 'w', encoding='utf-8') as f:
        for _ in range(count):
            # Select a random template and build one training record
            template = random.choice(templates)
            entry = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": template["user"]},
                    {"role": "assistant", "content": template["assistant"]}
                ]
            }
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

# Generate 50 for training and 15 for validation
generate_jsonl('training_set.jsonl', 50)
generate_jsonl('validation_set.jsonl', 15)

print("training_set.jsonl and validation_set.jsonl were created successfully.")