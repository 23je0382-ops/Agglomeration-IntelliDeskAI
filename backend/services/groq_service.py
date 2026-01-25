import os
import json
from groq import Groq
from dotenv import load_dotenv
from typing import Tuple, Optional

# Load environment variables
load_dotenv()

# Classification system prompt
# Classification system prompt
CLASSIFICATION_PROMPT = """
You are an AI support ticket classifier for a B2B SaaS company.

Your task is to classify an incoming ticket into exactly ONE predefined category.
You must base your decision ONLY on the ticket content.

Guidelines for Confidence Score (0-100):
- 95-100: Obvious intent, specific keywords present (e.g. "password reset" -> "Access Request").
- 80-94: Clear intent but slightly ambiguous wording.
- 50-79: Vague request or matches multiple categories loosely.
- 0-49: Completely unclear or gibberish.

Output MUST be valid JSON and nothing else.
"""

# Classification user prompt template
USER_PROMPT_TEMPLATE = """
Classify the following support ticket into ONE of the categories listed below.

CATEGORIES (choose exactly one):

1. Technical Support - System errors, bugs, crashes, login issues, performance problems
2. Access Request - Permission issues, account access, password resets, user provisioning
3. Billing/Invoice - Payment issues, subscription questions, invoice requests, pricing
4. Feature Request - New feature suggestions, enhancements, product feedback
5. Hardware/Infrastructure - Server issues, hardware problems, deployment, hosting
6. How-To/Documentation - Usage questions, how to do something, documentation requests
7. Data Request - Data export, reports, analytics, data deletion requests
8. Complaint/Escalation - Customer complaints, escalations, dissatisfaction
9. General Inquiry - Other questions that don't fit above categories

PRIORITY LEVELS (choose exactly one):

1. critical - System completely down, security breach, data loss, business-critical blocker
2. high - Major feature broken, affecting multiple users, deadline pressure, revenue impact
3. medium - Feature partially working, workaround exists, moderate impact
4. low - Questions, minor issues, cosmetic issues, nice-to-have requests

TICKET CONTENT:
\"\"\"
Title: {title}
Description: {description}
\"\"\"

Respond ONLY in the following JSON format:

{{
  "category": "<one of the listed categories - use short form like 'Technical Support'>",
  "priority": "<one of: critical, high, medium, low>",
  "confidence": <integer between 0 and 100>,
  "reason": "<one short sentence explaining why>"
}}
"""




class GroqService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.1-8b-instant"  # Fast and cost-effective model

    def classify_ticket(self, title: str, description: str) -> dict:
        """Classify ticket type and priority using Groq LLM with improved prompts"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": CLASSIFICATION_PROMPT},
                    {"role": "user", "content": USER_PROMPT_TEMPLATE.format(title=title, description=description)}
                ],
                temperature=0,
                max_tokens=200
            )
            
            result_text = response.choices[0].message.content.strip()
            # Parse JSON response
            result = json.loads(result_text)
            
            # Validate and normalize
            valid_priorities = ["critical", "high", "medium", "low"]
            
            # Use exact category from LLM
            category = result.get("category", "General Inquiry")
            # For backward compatibility/database schema, we'll store the simplified type as well if needed, 
            # but for now we will use the category as the type or a sanitized version of it.
            # However, prompt instruction says "category" is the output. 
            # We will use the category name directly as the 'type' in the database.
            ticket_type = category
            
            priority = result.get("priority", "medium").lower()
            confidence_raw = result.get("confidence", 80)
            confidence = float(confidence_raw) / 100.0  # Convert 0-100 to 0-1
            reason = result.get("reason", "")
            
            if priority not in valid_priorities:
                priority = "medium"
            
            print(f"Classification: type='{ticket_type}', priority='{priority}', confidence={confidence}, reason='{reason}'")
            
            return {
                "type": ticket_type,
                "priority": priority,
                "confidence": min(max(confidence, 0.0), 1.0),
                "category": category,
                "reason": reason
            }
            reason = result.get("reason", "")
            
            if priority not in valid_priorities:
                priority = "medium"
            
            print(f"Classification: category='{category}' -> type='{ticket_type}', priority='{priority}', confidence={confidence}, reason='{reason}'")
            
            return {
                "type": ticket_type,
                "priority": priority,
                "confidence": min(max(confidence, 0.0), 1.0),
                "category": category,
                "reason": reason
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            return {
                "type": "general",
                "priority": "medium",
                "confidence": 0.0,
                "category": "General Inquiry",
                "reason": "Failed to parse model output"
            }
        except Exception as e:
            print(f"Classification error: {e}")
            return {
                "type": "general",
                "priority": "medium",
                "confidence": 0.5,
                "category": "General Inquiry",
                "reason": str(e)
            }

    def generate_response(
        self, 
        title: str, 
        description: str, 
        ticket_type: str,
        context: Optional[str] = None
    ) -> Tuple[str, float]:
        """
        Generate a suggested response using Groq LLM.
        Now returns a calculated confidence score based on context relevance.
        """
        context_str = f"Relevant Knowledge Base Context:\n{context}" if context else "No specific knowledge base context available."
        
        prompt = f"""
You are a Senior Customer Support Agent. Your task is to draft a response to a ticket and rate your confidence.

TICKET DETAILS:
Title: {title}
Type: {ticket_type}
Description: {description}

{context_str}

INSTRUCTIONS:
1. Draft a professional, empathetic response. Use the Context if relevant.
2. Calculate Confidence Score (0-100):
   - 90-100: Context DIRECTLY answers the question.
   - 70-89: Context is related and helpful, but not an exact match.
   - 40-69: General knowledge used, no specific context match.
   - 0-39: Unsure, or question is unintelligible.
3. If no context is present, your confidence MUST be < 60 (unless it's a generic greeting).

OUTPUT FORMAT (JSON ONLY):
{{
  "response": "Dear [Customer], ...",
  "confidence": <int>
}}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful support agent. Output strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3, # Lower temperature for stable JSON
                max_tokens=800
            )
            
            content = response.choices[0].message.content.strip()
            # Clean potential markdown fences
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            if content.startswith("```"):
                content = content.replace("```", "")
            
            data = json.loads(content)
            
            suggested_response = data.get("response", "Thank you for contacting us. We received your request.")
            confidence_raw = data.get("confidence", 50)
            
            # Normalize to 0.0 - 1.0
            confidence = min(max(float(confidence_raw) / 100.0, 0.0), 1.0)
            
            print(f"Generated Response Confidence: {confidence}")
            return suggested_response, confidence
            
        except Exception as e:
            print(f"Response generation error: {e}")
            return "I apologize, but I am unable to generate a response at this time. An agent will review your ticket shortly.", 0.0

# Singleton instance
groq_service = GroqService()

def get_groq_service():
    return groq_service
